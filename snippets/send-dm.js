// 用途：向候选商家批量发送私信（关注 → 私信 → 填写 → 回车 → 判定送达）
// 调用方式：mcp__playwright__browser_run_code_unsafe 中执行本函数体
// 参数说明：把 targets 数组替换为本轮选中的 2-3 个目标（含 name/sec/fans/text）

async (page) => {
  const targets = [
    {
      name: '示例商家A',
      sec: 'MS4wLjABAAAA...',           // 用户 sec_uid（不含 /user/ 前缀）
      fans: '4.6 万',
      text: '你好，看你是做跨境电商的。跨境卖家收的都是美元货款，走平台放款周期长、还可能被冻款。外卡直连是另一条路，和内卡是两套通道和资质。外卡这块我们在做，<ENDORSEMENT_SENTENCE>。想问下你现在主要做哪个站点、货款怎么结？'
    }
  ];

  const ctx = page.context();
  let w = ctx.pages().find(p => p.url().includes('douyin.com/user'));
  if (!w) w = await ctx.newPage();

  const out = [];
  for (const t of targets) {
    await w.goto('https://www.douyin.com/user/' + t.sec, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await w.waitForTimeout(4500);   // 页面 ≥4.5s

    // 关注
    await w.evaluate(() => {
      const b = Array.from(document.querySelectorAll('[data-e2e="user-info-follow-btn"]'))
        .filter(x => x.getBoundingClientRect().width > 0)[0];
      if (b && (b.textContent || '').trim() !== '已关注') b.click();
    });
    await w.waitForTimeout(1300);

    // 点私信，最多试 2 次
    let ok = false;
    for (let a = 0; a < 2 && !ok; a++) {
      await w.evaluate(() => {
        const dm = Array.from(document.querySelectorAll('button'))
          .filter(x => (x.textContent || '').trim() === '私信' && x.getBoundingClientRect().width > 0);
        if (dm.length) dm[0].click();
      });
      await w.waitForTimeout(5500);  // 首次 5.5s / 第二次同样
      ok = await w.evaluate(() => !!document.querySelector('.messageMsgInputcontainer [contenteditable="true"]'));
    }
    if (!ok) { out.push({ name: t.name, dm: 'no-editor' }); continue; }  // 面板打不开 → 隔轮重试

    // 填写并发送
    await w.locator('.messageMsgInputcontainer [contenteditable="true"]').fill(t.text);
    await w.waitForTimeout(600);
    await w.keyboard.press('Enter');
    await w.waitForTimeout(2500);

    // 判定：编辑框清空 + 有我方文案 + 无「仅和他互关」
    const chk = await w.evaluate(() => {
      const ed = document.querySelector('.messageMsgInputcontainer [contenteditable="true"]');
      const left = ed ? (ed.innerText || '').replace(/\u200b/g, '').trim() : '__';
      let top = ed;
      for (let i = 0; i < 14 && top && top.parentElement; i++) top = top.parentElement;
      const tt = top ? top.innerText : '';
      return {
        empty: left.length === 0,
        blocked: /仅和他互关 | 暂无法给对方发送消息/.test(tt),
        mine: /外卡/.test(tt)
      };
    });

    out.push({
      name: t.name,
      dm: chk.blocked ? 'blocked' : ((chk.empty && chk.mine) ? 'sent' : 'not-sent')
    });
    // blocked → 不重试；not-sent → 可重试一次（按需）
  }

  return { out };
}
