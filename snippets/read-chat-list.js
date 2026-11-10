// 用途：读私信管理列表，输出每个会话的名称 / 时间 / 最后一条消息，用于判定新回复
// 调用方式：mcp__playwright__browser_run_code_unsafe 中执行本函数体
// 注意：列表偶尔只渲染 76 字符 → 本代码内置 reload + 长等待重试

async (page) => {
  const ctx = page.context();
  let chat = ctx.pages().find(p => p.url().includes('following/chat'));
  if (!chat) chat = await ctx.newPage();

  await chat.goto('https://creator.douyin.com/creator-micro/data/following/chat', {
    waitUntil: 'domcontentloaded', timeout: 30000
  }).catch(() => {});
  await chat.bringToFront();
  await chat.waitForTimeout(15000);

  let t = await chat.evaluate(() => document.body.innerText || '');

  // 页面未渲染完整时重试一次
  if (t.length < 200) {
    await chat.reload({ waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await chat.waitForTimeout(30000);
    t = await chat.evaluate(() => document.body.innerText || '');
  }

  const loggedOut = /扫码登录|验证码登录/.test(t);
  if (loggedOut) return { loggedOut: true, totalChars: t.length, sessions: [] };

  // 解析会话列表：名称行 → 时间行 → 最后一条消息行
  const listStart = t.indexOf('全选');
  const chunk = listStart >= 0 ? t.slice(listStart + 2) : t;
  const lines = chunk.split('\n').map(s => s.trim()).filter(s => s.length > 0);

  const timeRe = /^(刚刚|\d{1,2}:\d{2}|昨天|前天|星期[一二三四五六日]|\d{2}-\d{2}|置顶|已读|删除)$/;
  const sessions = [];
  for (let i = 0; i < lines.length - 2; i++) {
    if (timeRe.test(lines[i + 1])) {
      sessions.push({
        name: lines[i],
        time: lines[i + 1],
        last: lines[i + 2].slice(0, 160)
      });
      i += 2;
    }
  }

  return { loggedOut: false, totalChars: t.length, sessions: sessions.slice(0, 40) };
}
