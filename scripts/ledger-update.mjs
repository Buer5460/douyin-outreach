#!/usr/bin/env node
/**
 * ledger.json 读写工具（BOM 安全，必须用 Node，禁止 PowerShell Set-Content）
 *
 * 用法：
 *   node ledger-update.mjs add  <json-file>     # 追加一条 action
 *   node ledger-update.mjs reply <json-file>    # 更新某条 action 的回复信息
 *   node ledger-update.mjs stats                # 打印统计
 *
 * add 的 json-file 内容示例（临时文件）：
 * { "ts":"2026-11-10T18:00:00+08:00", "user":"某商家", "fans":"4.6 万",
 *   "sec":"MS4wLjABAAAA...", "source":"search:跨境电商?type=user",
 *   "signal":"<细分>·<主打能力>", "follow":"ok", "dm":"sent", "replied":false,
 *   "foundVia":"商家直搜", "segment":"C", "dmText":"你好，看你是做..." }
 *
 * reply 的 json-file 内容示例：
 * { "user":"某商家", "repliedAt":"2026-11-10T19:00:00+08:00",
 *   "replyContent":"多少钱", "classification":"接受", "ourFollowUp":"已按 profile.compliance.quote_script 回复" }
 */
import fs from 'node:fs';
import path from 'node:path';

const LEDGER = process.env.LEDGER_PATH ||
  '<DSH_HOME>\\douyin-outreach\\ledger.json';

function load() {
  return JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
}
function save(l) {
  fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2), 'utf8');
}
function todayCN() {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai', dateStyle: 'short'
  }).format(new Date());
  return parts; // YYYY-MM-DD
}

const [cmd, fileArg] = process.argv.slice(2);

if (cmd === 'add') {
  if (!fileArg) throw new Error('add 需要传入 action json 文件路径');
  const action = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
  const l = load();
  l.actions.push(action);
  if (action.dm === 'sent') {
    l.stats.totalTargets = (l.stats.totalTargets || 0) + 1;
    l.stats.dmSent = (l.stats.dmSent || 0) + 1;
  }
  if (action.dm === 'blocked') l.stats.blocked = (l.stats.blocked || 0) + 1;
  save(l);
  const today = l.actions.filter(a => (a.ts || '').startsWith(todayCN())).length;
  console.log(JSON.stringify({ added: action.user, today, stats: l.stats }, null, 2));
}

else if (cmd === 'reply') {
  if (!fileArg) throw new Error('reply 需要传入 reply json 文件路径');
  const info = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
  const l = load();
  const t = l.actions.find(a => a.user === info.user);
  if (!t) throw new Error('未找到用户: ' + info.user);
  Object.assign(t, {
    replied: true,
    repliedAt: info.repliedAt,
    replyContent: info.replyContent,
    classification: info.classification,
    ourFollowUp: info.ourFollowUp
  });
  l.stats.replied = l.actions.filter(a => a.replied).length;
  save(l);
  console.log(JSON.stringify({ updated: info.user, classification: info.classification, repliedTotal: l.stats.replied }, null, 2));
}

else if (cmd === 'stats') {
  const l = load();
  const today = todayCN();
  const t = l.actions.filter(a => (a.ts || '').startsWith(today));
  console.log(JSON.stringify({
    date: today,
    todaySent: t.filter(a => a.dm === 'sent').length,
    todayBlocked: t.filter(a => a.dm === 'blocked').length,
    todayReplied: t.filter(a => a.replied).length,
    quotaUsed: t.filter(a => a.dm === 'sent').length + '/20',
    stats: l.stats,
    replyRate: l.stats.dmSent ? (l.stats.replied / l.stats.dmSent * 100).toFixed(1) + '%' : '无数据'
  }, null, 2));
}

else {
  console.log('用法: node ledger-update.mjs add|reply|stats [json-file]');
}
