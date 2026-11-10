// 用途：在抖音用户搜索页抓取候选商家（按粉丝量与关键词过滤）
// 调用方式：mcp__playwright__browser_run_code_unsafe 中执行本函数体
// 参数说明：把 QUERY 改成当前轮次的目标搜索词

async (page) => {
  const QUERY = '跨境电商'; // 轮换：外贸工厂 / 独立站 / 外贸收款 / 海外批发 / 国际物流 / 跨境卖家 / 出海品牌 / 海外仓 / 亚马逊卖家

  const ctx = page.context();
  let w = ctx.pages().find(p => p.url().includes('douyin.com/search'));
  if (!w) w = await ctx.newPage();

  await w.goto('https://www.douyin.com/search/' + encodeURIComponent(QUERY) + '?type=user', {
    waitUntil: 'domcontentloaded', timeout: 45000
  });
  await w.bringToFront();
  await w.waitForTimeout(4500);
  for (let s = 0; s < 2; s++) { await w.mouse.wheel(0, 800); await w.waitForTimeout(1100); }

  const cands = await w.evaluate(() => {
    const seen = new Set();
    const o = [];
    for (const a of document.querySelectorAll('a[href*="/user/"]')) {
      if (a.href.includes('/user/self')) continue;
      const m = (a.getAttribute('href') || '').match(/\/user\/([A-Za-z0-9_-]+)/);
      if (!m) continue;
      const tx = (a.innerText || '').replace(/\n/g, ' | ').trim();
      if (!tx) continue;
      const nm = tx.split(' | ')[0];
      if (seen.has(nm)) continue;
      seen.add(nm);
      // 排除同行/服务商
      if (/支付|通道|分账|收银|POS|系统搭建|扫码|软件|科技|培训|咨询|学院|服务商/.test(nm)) continue;
      const fm = tx.match(/([\d.]+)(万)?粉丝/);
      let fans = null;
      if (fm) fans = parseFloat(fm[1]) * (fm[2] ? 10000 : 1);
      // 粉丝 1 万–20 万（低于 1 万约 27% 关了陌生人私信）
      if (fans !== null && (fans < 10000 || fans > 200000)) continue;
      o.push({ name: nm.slice(0, 20), fans: fm ? fm[0] : '?', sec: m[1] });
    }
    return o.slice(0, 15);
  });

  return { query: QUERY, cands };
}
