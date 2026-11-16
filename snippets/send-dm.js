// 用途：批量发送私信（关注 → 私信 → 填写 → 回车 → 送达判定）
// 调用：mcp__playwright__browser_run_code_unsafe
// targets[].text 由上层 agent 用 profile.segments[].pain / opener_questions / endorsement 组装，
// 组装完成必须自查：≤120字、含一个明确问题、不含 profile.compliance.forbid 任一项。

async (page) => {
  // ↓↓↓ 由上层按 profile 生成后填入（2-3 条/轮）↓↓↓
  const targets = [
    {
      name: "<商家昵称>",
      sec: "<sec_uid>",
      fans: "<粉丝数>",
      segment: "<profile.segments[].id>",
      text: "<按开场模板组装的 ≤120 字文案>"
    }
  ];

  const ctx = page.context();
  let w = ctx.pages().find(p => p.url().includes('douyin.com/user'));
  if (!w) w = await ctx.newPage();

  const out = [];
  for (const t of targets) {
    await w.goto('https://www.douyin.com/user/' + t.sec, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await w.waitForTimeout(4500);

    await w.evaluate(() => {
      const b = Array.from(document.querySelectorAll('[data-e2e="user-info-follow-btn"]'))
        .filter(x => x.getBoundingClientRect().width > 0)[0];
      if (b && (b.textContent || '').trim() !== '已关注') b.click();
    });
    await w.waitForTimeout(1300);

    let ok = false;
    for (let a = 0; a < 2 && !ok; a++) {
      await w.evaluate(() => {
        const dm = Array.from(document.querySelectorAll('button'))
          .filter(x => (x.textContent || '').trim() === '私信' && x.getBoundingClientRect().width > 0);
        if (dm.length) dm[0].click();
      });
      await w.waitForTimeout(5500);
      ok = await w.evaluate(() => !!document.querySelector('.messageMsgInputcontainer [contenteditable="true"]'));
    }
    // 面板打不开：记 no-editor，隔轮重试（实测有效）；不得记 dm:sent
    if (!ok) { out.push({ name: t.name, segment: t.segment, dm: 'no-editor' }); continue; }

    await w.locator('.messageMsgInputcontainer [contenteditable="true"]').fill(t.text);
    await w.waitForTimeout(600);
    await w.keyboard.press('Enter');
    await w.waitForTimeout(2500);

    const chk = await w.evaluate((mine) => {
      const ed = document.querySelector('.messageMsgInputcontainer [contenteditable="true"]');
      const left = ed ? (ed.innerText || '').replace(/\u200b/g, '').trim() : '__';
      let top = ed;
      for (let i = 0; i < 14 && top && top.parentElement; i++) top = top.parentElement;
      const tt = top ? top.innerText : '';
      return {
        empty: left.length === 0,
        blocked: /仅和他互关|暂无法给对方发送消息/.test(tt),   // 被拦：永不重试
        mine: tt.includes(mine)
      };
    }, t.text.slice(4, 12));

    out.push({
      name: t.name, segment: t.segment,
      dm: chk.blocked ? 'blocked' : ((chk.empty && chk.mine) ? 'sent' : 'not-sent')
    });
  }
  return { out };
}
