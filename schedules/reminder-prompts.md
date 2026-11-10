# 4 个定时提醒任务 Prompt 模板

> 用 DSH 的 `schedule_create` 工具创建，target 一律 `this_session`。
> 创建后把返回的 schedule_id 记下来，便于 `schedule_edit` 调整或停用。

---

## ① 获客轮（每 2 小时，7/9/11/13/15/17/19/21）

**rrule**（用当天日期替换 YYYYMMDD；HOURS 间隔 2，靠 prompt 内的安静时段与额度自守）：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT070000
RRULE:FREQ=HOURLY;INTERVAL=2;COUNT=1000
```

**prompt**：
```
抖音获客（每 2 小时｜目标：拿到能对话的真买家，不是凑发送量）

【安静时段】取北京时间；<7 或 >=22 立即结束，一句话汇报即可，不调用工具。

【限流】日限 20 条，今天已发 >=18 停止新触达。

【第0步｜登录态】开 https://creator.douyin.com/creator-micro/data/following/chat 等 15 秒。出现「扫码登录」→ 截图 <DSH_HOME>/douyin-outreach/douyin-login.png，报「需人工扫码」，本轮结束。页面可能被其他标签页抢走：用 page.context().pages() 找到 chat 标签页，bringToFront 后再操作。

【第一优先级｜主动来消息的人（高于一切开发）】见回复监控任务的分类规则；接受类最多再跟 1 条。

【第二优先级｜选人】C 外卡占 2/3，B 分账占 1/3。搜索词轮换：跨境电商 / 外贸工厂 / 独立站 / 外贸收款 / 海外批发 / 国际物流 / 跨境卖家 / 出海品牌 / 海外仓 / 亚马逊卖家。筛粉丝 1-20 万，排除支付/通道/分账/收银/POS/系统搭建/软件/科技/培训等同行。暂停：建材批发、社区团购、涉外餐厅。

C 客群开场结构：引用其业务特征 → 点出外卡与内卡是两套通道两套资质 →「外卡这块我们在做，<ENDORSEMENT_SENTENCE>」→ 一个低门槛问题（客户在哪些国家 / 现在怎么收 / 月流水多少美金）。

【报价口径】不报费率、不承诺到账/审批/返点。问价回：「费率要按类目和走的通道定，我给报错后面还得改。你把业务类型和月流水量级发我，我出一版带费率的方案。」主动问联系方式才回「官网 <YOUR_WEBSITE_DOMAIN>，或企业信息平台搜<COMPANY_LEGAL_NAME>」。

【执行】开 user 页等 >=4.5s → 点 [data-e2e="user-info-follow-btn"] 变「已关注」→ 点「私信」等 >=5000ms，未出编辑器同页再点一次等 5.2s → fill → 等 600ms → Enter → 判：编辑框清空 + 有我方文案 + 无「仅和他互关」= 送达；被拦不重试；仍有内容重试一次。面板打不开可隔轮重试。每轮目标 2-3 条送达；不足时补 C 客群候选，不降低标准。

【背书轮换】外卡已服务上百家商户 / <COMPANY_BRAND_NAME·成立年·城市> / <渠道方名单> / <银行合作名单> / <标杆交付案例> / <服务规模>

【硬规则】禁网址域名、禁微信手机号、禁「最低/最好/100%/保证」；重复率<80%；<=120字；第一句必须体现懂他做的生意。

【记录】node 追加 ledger.json（ts/user/fans/sec/source/signal/segment/follow/dm/dmText/replied/classification/foundVia）；禁用 PowerShell 写 JSON。

【汇报】登录状态、本轮送达/被拦/失败、客群分布、今日 x/20、判定了哪些目标接受/拒绝/待观察。
```

---

## ② 回复监控（每 15 分钟）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT071500
RRULE:FREQ=MINUTELY;INTERVAL=15;COUNT=2000
```

**prompt**：
```
抖音私信回复监控（只做回访与接话，不主动开发新客户，不占开发额度）

【安静时段｜最高优先级】先取当前北京时间。若小时数 <7 或 >=22，立即结束本轮：不打开任何页面、不调用任何工具，只回一句「安静时段（22:00-07:00）不执行」。

【步骤】
1) 用 Playwright MCP 打开 https://creator.douyin.com/creator-micro/data/following/chat，读「私信管理」列表里每个会话的最后一条与时间（列表偶发只渲染 76 字符时 reload 后等 15-30s 重读）。
2) 与 <DSH_HOME>\douyin-outreach\ledger.json 中 actions 的 dmText/ourFollowUp 比对：最后一条是对方发的 = 有新回复。
3) 对每个新回复，打开该用户主页 https://www.douyin.com/user/<sec_uid> → 点「私信」→ 读完整对话 → 回复一条。
4) 回复完把结果写回 ledger.json（replied / repliedAt / replyContent / classification / ourFollowUp），只用 Node 写。

【意向分类（严格执行）】
■ 接受（可跟，最多 1 条）：问费率 / 问资料 / 问开通条件 / 要方案 / 报业务类型或流水 / 问公司在哪 / 要见面。
■ 拒绝（立即停跟，永不追加）：只回「谢谢/好的/收到/嗯/OK」且没回答提问；「不用了/再说/已解决」；要加V或发名片；明显厌烦。
■ 待观察（不发消息，24h 内不重发）：只发表情/图片/自动回复。
■ 需人工介入（不自行回复，只记录并在汇报标红）：要具体报价、签合同、开发票、上门、投诉、明确表达不满。
■ 不算回复：诚邀评价 / 智能客服接待结束 / 「在线、留下您的对接方式」/ 关注触发的「新类型消息」推送。

【铁律】对方不答我方问题就不许追问第二条。同一用户 24h 内我方消息上限 2 条。每条我方消息必须带一个明确问题。

【回复原则】
- 可以：确认收到、追问必要信息（业务类型 / 月流水量级 / 是否需要分账或代收 / 是否需要D0）、说明接入资料、给「资料齐全最快一周跑通首笔真实交易」这类官网已公开事实。
- 不可以：报具体费率数字、承诺到账时间、承诺审批结果、承诺返点、留微信号手机号、发网址域名、用"最/保证/100%"。
- 问费率标准回应：「费率要按类目和走的通道定，我给你报错后面还得改。你把业务类型和月流水量级发我，我出一版带费率的方案。」
- 问联系方式才回：「官网 <YOUR_WEBSITE_DOMAIN>，或企业信息平台搜<COMPANY_LEGAL_NAME>。」
- 每条 <=100 字，一次只问 1-2 个问题，不连续追问。

【限速】每轮最多回复 5 个会话；无人回复直接汇报「本轮无新回复」，不额外操作。
```

---

## ③ 支付科普视频（每日 10:00）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT100000
RRULE:FREQ=DAILY
```

**prompt**：见 `skills\douyin-outreach\SKILL.md` 的「视频产线」一节，整段复制即可（含查重、结构、产线 6 步、汇报要求）。

---

## ④ 日报（每日 21:30）

**rrule**：
```
DTSTART;TZID=Asia/Shanghai:YYYYMMDDT213000
RRULE:FREQ=DAILY
```

**prompt**：见 `skills\douyin-outreach\SKILL.md` 的「日报」一节，整段复制即可（含 7 段报告结构与精简汇报要求）。
