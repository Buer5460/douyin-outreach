// 用途：在抖音用户搜索页抓取候选商家（粉丝量与同行排除均来自 profile.yaml）
// 调用：mcp__playwright__browser_run_code_unsafe
// 使用前：执行本文件的 agent 必须先把 CONFIG 三行从 profile.yaml 填入，
//         未填完禁止运行（这是技能「行业无关」的关键：脚本不含任何行业假设）。

async (page) => {
  // ↓↓↓ 由 profile.yaml 注入（必填，占位符未替换就不要执行）↓↓↓
  const CONFIG = {
    query:       "__FROM_profile.segments[i].keywords__",   // 本轮搜索词
    peerRegex:   "__FROM_profile.peer_exclude_regex__",     // 同行排除
    fansMin:     "__FROM_profile.audience_filter.fans_min__",
    fansMax:     "__FROM_profile.audience_filter.fans_max__"
  };
  // ↑↑↑ 注入完成校验 ↑↑↑
  if (Object.values(CONFIG).some(v => typeof v === "string" && v.startsWith("__FROM_"))) {
    return { error: "CONFIG 未从 profile.yaml 注入，禁止运行" };
  }

  const ctx = page.context();
  let w = ctx.pages().find(p => p.url().includes('douyin.com/search'));
  if (!w) w = await ctx.newPage();

  await w.goto('https://www.douyin.com/search/' + encodeURIComponent(CONFIG.query) + '?type=user', {
    waitUntil: 'domcontentloaded', timeout: 45000
  });
  await w.bringToFront();
  await w.waitForTimeout(4500);
  for (let s = 0; s < 3; s++) { await w.mouse.wheel(0, 900); await w.waitForTimeout(1100); }

  const cands = await w.evaluate(({ peerSource, min, max }) => {
    const peerRe = new RegExp(peerSource, 'i');
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
      if (peerRe.test(nm)) continue;                        // 同行/竞对排除
      const fm = tx.match(/([\d.]+)(万)?粉丝/);
      let fans = null;
      if (fm) fans = parseFloat(fm[1]) * (fm[2] ? 10000 : 1);
      if (fans !== null && (fans < min || fans > max)) continue;
      o.push({
        name: nm.slice(0, 20),
        fans: fm ? fm[0] : '?',
        desc: (tx.split(' | ')[1] || '').slice(0, 60),      // 简介：判断经营痕迹与细分类型
        sec: m[1]
      });
    }
    return o.slice(0, 15);
  }, { peerSource: CONFIG.peerRegex, min: Number(CONFIG.fansMin), max: Number(CONFIG.fansMax) });

  // 上层流程：与 ledger.json 比对去重（已发过的跳过）→ 按 profile.segments[].share 配额挑 2-3 个
  //          → 用该 segment 的 pain / sub_variants / opener_questions 组开场文案
  return { query: CONFIG.query, cands };
}
