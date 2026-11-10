// 用途：把成片上传到抖音创作者中心并发布，随后回读作品列表确认
// 调用方式：mcp__playwright__browser_run_code_unsafe 中执行本函数体
// 前置：把 final.mp4 复制到 profiles\desktop\.playwright-mcp\（上传有目录限制）
// 参数说明：改 FILE / TITLE / DESC

async (page) => {
  const FILE = '<DSH_HOME>\\profiles\\desktop\\.playwright-mcp\\epNN-final.mp4';
  const TITLE = '支付常识 第NN期：<一句话>';
  const DESC = '正文第一句。\n\n要点段落。\n\n私信说下你现在怎么收。\n\n#外卡 #跨境收款 #支付常识 #商户号 #跨境';

  const ctx = page.context();
  let w = ctx.pages().find(p => p.url().includes('creator.douyin.com'));
  if (!w) w = await ctx.newPage();

  // 1. 打开上传页
  await w.goto('https://creator.douyin.com/creator-micro/content/upload', {
    waitUntil: 'domcontentloaded', timeout: 60000
  });
  await w.bringToFront();
  await w.waitForTimeout(8000);

  // 2. 选择文件（直接 setInputFiles 比点「点击上传」可靠）
  const input = await w.$('input[type="file"]');
  if (!input) return { ok: false, stage: 'file-input', msg: '未找到 input[type=file]' };
  await input.setInputFiles(FILE);
  await w.waitForTimeout(15000);

  // 3. 等上传完成
  const t0 = await w.evaluate(() => document.body.innerText || '');
  if (t0.includes('上传过程中请不要删除')) {
    await w.waitForTimeout(15000);
  }

  // 4. 填标题与描述
  const titleInput = await w.$('input[type="text"]');
  if (titleInput) {
    await titleInput.click();
    await titleInput.fill(TITLE);
  }
  await w.waitForTimeout(1000);

  const descArea = await w.$('textarea, [contenteditable="true"]');
  if (descArea) {
    await descArea.click();
    await descArea.fill(DESC);
  }
  await w.waitForTimeout(1500);

  // 5. 点发布
  await w.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if ((b.textContent || '').trim() === '发布' && b.getBoundingClientRect().width > 0) {
        b.click();
        break;
      }
    }
  });
  await w.waitForTimeout(15000);

  // 6. 回读作品列表确认（必须 reload 才能看到新作品）
  await w.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await w.waitForTimeout(12000);
  const t1 = await w.evaluate(() => document.body.innerText || '');
  const countMatch = t1.match(/作品 \((\d+)\)/);
  const hit = t1.includes(TITLE.slice(0, 12));

  return {
    ok: hit,
    count: countMatch ? countMatch[1] : null,
    verified: hit ? '作品列表已出现' : '未在列表中找到',
    statusHint: t1.includes('审核中') ? '审核中' : (t1.includes('已发布') ? '已发布' : '未知')
  };
}
