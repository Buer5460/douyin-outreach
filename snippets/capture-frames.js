// 用途：HTML 动画逐帧截图（960 帧 = 32s @ 30fps），供 ffmpeg 编码
// 调用方式：mcp__playwright__browser_run_code_unsafe 中执行本函数体
// 参数说明：改 PAGE / FRAMES_DIR / from / to（分批 480 帧，超时后从断点数继续）

async (page) => {
  const PAGE = 'file:///G:/DeepSeek%E7%94%B5%E8%84%91%E4%BF%AE%E5%A4%8D/EAC-design-world/pay-shorts/epNN.html';
  const FRAMES_DIR = '<WORK_DIR>/pay-shorts/frames/epNN';
  const from = 0;      // 断点续：先数已有帧数，从 breakPoint 开始
  const to = 480;      // 第二批改 480 → 960

  const ctx = page.context();
  let t = ctx.pages().find(p => p.url().includes('epNN.html'));
  if (!t) t = await ctx.newPage();
  await t.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await t.setViewportSize({ width: 1080, height: 1920 });
  await t.bringToFront();
  await t.waitForTimeout(1000);

  for (let i = from; i < to; i++) {
    await t.evaluate(x => window.__seek(x), i / 30);
    await t.screenshot({
      path: FRAMES_DIR + '/f' + String(i).padStart(4, '0') + '.png'
    });
  }

  return { captured: to - from, from, lastFrame: to - 1 };
}

// 后续命令（PowerShell）：
// ffmpeg -y -framerate 30 -i "frames\epNN\f%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 -r 30 -movflags +faststart epNN-out.mp4
// 成功后 Remove-Item -Recurse -Force frames\epNN
