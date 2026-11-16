# 定时提醒任务 Prompt（profile 驱动版）

> 用 DSH 的 `schedule_create` 创建，target 一律 `this_session`。
> 这些 prompt **不含任何行业词**——行业、客群、话术全部由技能在运行时读 `profile.yaml` 决定。
> 换行业只需改 profile.yaml，定时任务不用重建。

---

## ① 获客轮（每 2 小时）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT070000
RRULE:FREQ=HOURLY;INTERVAL=2;COUNT=1000
```

**prompt**：
```
执行 douyin-outreach 技能的「获客轮」（见 skills/douyin-outreach/SKILL.md）。

【第 0 步】取北京时间；安静时段（profile.limits.quiet_hours，默认 22:00-07:00）立即结束不操作。
检查 <STATE_DIR>/profile.yaml：不存在 → 先跑 SKILL.md「第 -1 步首次运行引导」，本次不发送。
检查日额度：今日 ledger 已 sent >= profile.limits.stop_threshold → 停止新触达只汇报。

【第 1 步 登录态】开 creator.douyin.com/creator-micro/data/following/chat 等 15s；出现「扫码登录」→ 截图 douyin-login.png，报「需人工扫码」，本轮结束。
页面被抢用 page.context().pages() 找 chat 标签页 + bringToFront()。

【第 2 步 回复优先】私信列表里凡「对方发的」新消息，按 SKILL.md 意向分类（接受/拒绝/待观察/需人工介入）处理，高于一切开发。分类框架行业通用；报价口径、联系方式口径、人工介入触发项从 profile.compliance 读。

【第 3 步 开发】按 profile.segments 的 share 配额选 2-3 个新目标：
- snippets/search-candidates.js，CONFIG 从 profile 注入（keywords 轮换 / peerRegex / fansMin / fansMax）
- 与 ledger 去重：已发过、被拦过、24h 内的不碰；profile.paused_segments 跳过
- 文案：「你好，看你是做{业务特征}的。{该 segment 的 pain，可套 sub_variants}。{endorsement}。想问下{该 segment 的 opener_questions 之一}？」
- 自查：≤120字、恰好一个明确问题、无 profile.compliance.forbid 项、事实全部来自 profile（禁止临场编数字/案例）
- snippets/send-dm.js 执行；面板打不开记 no-editor 隔轮重试；被拦不重试

【第 4 步 记账】scripts/ledger-update.mjs add 逐条写入；只准 Node 写 JSON。

【汇报】登录态；本轮送达/被拦/no-editor 明细与 segment 分布；今日 x/profile.limits.daily_quota；新判定的接受/拒绝/待观察。
```

---

## ② 回复监控（每 15 分钟）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT091500
RRULE:FREQ=MINUTELY;INTERVAL=15;COUNT=2000
```

**prompt**：
```
执行 douyin-outreach 技能的「回复监控」（不开发新客户，不占额度）。

【安静时段】北京时间 <7 或 >=22（按 profile.limits.quiet_hours）→ 只回一句不执行。

1) snippets/read-chat-list.js 读私信管理列表（<200 字符就 reload 再等 20-30s）。
2) 与 <STATE_DIR>/ledger.json 的 dmText/ourFollowUp 比对：最后一条是对方发的 = 新回复。
3) 逐条按 SKILL.md 意向分类：接受（问价/问资质/要方案/报规模/约见面，按 profile.compliance.quote_script 回，最多再 1 条）/ 拒绝（只回礼貌词没答问题、不用了、索要规定外联系方式、厌烦 → 停跟永不追加）/ 待观察（表情/图片/自动回复 → 24h 不重发）/ 需人工介入（合同/发票/上门/投诉/profile.handoff_triggers → 不回复只标记）。
   铁律：对方不答我方问题不许追问第二条；同一用户 24h 我方 ≤2 条；每条我方消息必须带一个问题；≤100 字。
   非目标客群的陌生推销/索要联系方式（我方从未提供过的）：ledger 记「拒绝/非客群」不回复。
4) 结果用 ledger-update.mjs reply 写回（replied/repliedAt/replyContent/classification/ourFollowUp）。
5) 每轮最多回 5 个会话；无新回复只汇报「本轮无新回复」。
```

---

## ③ 行业科普视频（每日 10:00）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT100000
RRULE:FREQ=DAILY
```

**prompt**：
```
执行 douyin-outreach 技能的「视频产线」（SKILL.md 同名一节，全部规则以其为准）。

profile.video.enabled=false → 汇报「档案未启用视频」结束。
安静时段（<7 或 >=22）结束。

关键要求（违反即返工）：
1. 选题查重：video-topics.md 核心痛点命中 = 重复，必须换题（只换措辞不算新题）；从 profile.video.topic_pool 选未用的。选定先登记「制片中」。
2. HTML：复制 templates/video-master.html 到工作目录改【文案区】；自包含、系统字体、__meta={duration:32,width:1080,height:1920,fps:30}、__seek(t) 纯函数。
3. 结构 32s：0-3s 钩子（具体现象+疑问）→ 3-25s 三要点（人话+熟悉场景，数字必须真实）→ 25-32s 收尾用 profile.video.cta 给低门槛动作，禁「欢迎咨询」。
4. 合规：profile.compliance.forbid 逐条过（无绝对化用语/无承诺/无联系方式/不贬低同行/不教规避风控）。
5. 逐帧 snippets/capture-frames.js（960 帧 2 批；超时先数已有帧从断点续）；ffmpeg 编码后删帧目录。
6. 配音按 profile.eac（无则系统 TTS/静音并在汇报注明）。GPT-SoVITS 报 fast-langdetect 缓存 → 见 SKILL.md 坑列表。
7. 混音后 ffprobe 必须实测：1080×1920/30fps/32.000s/（音频流情况如实记录）。
8. 发布 snippets/upload-video.js：成片先复制到 .playwright-mcp 目录（上传白名单）；标题「profile.video.title_prefix 第NN期：<一句话>」；描述 3+ 话题 + 行动指令；发布后 reload 作品列表确认出现（记总数+状态）。
9. 记账：ledger 之外用 Node 写 video-episodes.json，topics 表改「已用」。

【汇报】期号 / 查重对比 / 目标客群 / ffprobe 实测值 / 配音引擎 / 发布是否经作品列表核实。渲染完成 ≠ 已发布。
```

---

## ④ 日报（每日 21:30）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT213000
RRULE:FREQ=DAILY
```

**prompt**：
```
执行 douyin-outreach 技能的「日报」（SKILL.md 同名一节）。安静时段（<7 或 >=22）结束。

只依据真实数据（ledger.json / video-episodes.json / content/manage 页面实测），缺失写「无数据」，禁止编造。
1. 今日+累计获客表（额度分母用 profile.limits.daily_quota）
2. 视频复盘（profile.video.enabled 时）：近 3 期播放/完播率/2秒跳出率实测；<24h 标「数据未稳定」；不满 3 期写「样本不足不建议调整」
3. 各 segment 回复率对比 → 名额轮换建议
4. 调整建议 ≤3 条，「把 X 改成 Y，因为 Z（带数字）」，禁空话
5. 写 reports/daily-YYYY-MM-DD.md（7 段）；对话里只给精简版：5 个获客关键数字 + 视频数据 + 1 条最重要发现 + 3 条建议 + 报告路径。
```
