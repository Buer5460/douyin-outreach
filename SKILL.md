---
name: douyin-outreach
description: 抖音商家私信获客自动化 + 支付科普短视频产线。用于执行「<COMPANY_BRAND_NAME>」B2B 外卡/跨境收款客群的定时私信开发、回复意向监控分类、每日支付常识短视频（HTML→逐帧→ffmpeg→本地TTS配音→上传发布）与每日数据日报。触发词：抖音获客、私信监控、支付科普视频、获客日报、douyin outreach。
---

# 抖音获客自动化 + 视频产线

## 定位
对抖音<你的抖音账号>账号执行两类自动化：① B2B 商家私信开发与回复监控（主攻 C 外卡客群）；② 每日一条支付科普短视频（获客辅助资产）。所有执行状态落盘到 `<DSH_HOME>\douyin-outreach\`（其他电脑路径见 setup.md 第 3 步自定义）。

## 第 0 步：环境检查（每次会话先做）
1. 确认工具可用：Playwright MCP（browser_*）、PowerShell、Node。
2. 确认状态目录存在：`douyin-outreach\ledger.json`、`video-topics.md`、`video-episodes.json`、`reports\`。
3. 确认 ffmpeg 在 PATH；确认 EAC 项目（projectId `<EAC_PROJECT_ID>`（eac_status 查询））与 `ttsVoice=mambo-zh` 可用（eac_status）。
4. 登录态检查：打开 `https://creator.douyin.com/creator-micro/data/following/chat` 等 15s。出现「扫码登录/验证码登录」→ 截图到 `douyin-outreach\douyin-login.png`，报「需人工扫码」，本轮结束。

## 铁律（任何时候不可违反）
- **安静时段**：北京时间 22:00–07:00 不执行任何轮次，不调用工具。
- **合规红线**：不报费率数字、不承诺到账/审批/返点、不留微信/手机号/网址（除非对方主动问联系方式→回「官网 <YOUR_WEBSITE_DOMAIN>，或企业信息平台搜<COMPANY_LEGAL_NAME>」）、不用「最/第一/100%/保证」等绝对化用语。
- **回复铁律**：对方不答我方问题就不许追问第二条；同一用户 24h 内我方消息 ≤2 条；我方每条消息必须带一个明确问题。
- **记账**：ledger.json 只用 Node 写（PowerShell Set-Content 会产生 BOM 导致解析失败）。
- **多标签页**：Playwright 页面会被其他 tab 抢走报 "Execution context destroyed" → 一律用 `page.context().pages().find(p=>p.url().includes(...))` 找目标 tab 再 `bringToFront()`。

## 获客轮（每 2 小时：7/9/11/13/15/17/19/21）
**目标：拿到能对话的真买家，不是凑发送量。**
- 限流：日限 20 条；今天已发 ≥18 停止新触达。
- 第一优先级：主动来消息的人（见「回复监控」分类处理），高于一切开发。
- 选人（snippets/search-candidates.js）：搜索词轮换 `跨境电商 / 外贸工厂 / 独立站 / 外贸收款 / 海外批发 / 国际物流 / 跨境卖家 / 出海品牌 / 海外仓 / 亚马逊卖家`；筛粉丝 1–20 万；排除支付/通道/分账/收银/POS/系统搭建/软件/科技/培训等同行；认证徽章或公司字样优先。
- **客群配额**：C 外卡主攻占 2/3（结构：引用其业务 → 外卡与内卡两套通道两套资质 → 「外卡这块我们在做，<ENDORSEMENT_SENTENCE>」→ 一个低门槛问题：客户在哪些国家/现在怎么收/月流水多少美金）；B 分账占 1/3（分账系统/多商户分账/连锁加盟收款/批发档口；痛点：钱进一个户、分账靠手工对账）；A 异地收款备用。**暂停**：建材批发、社区团购、涉外餐厅（历史全失败）。
- 执行（snippets/send-dm.js）：开 user 页等 ≥4.5s → 点 `[data-e2e="user-info-follow-btn"]` 变「已关注」→ 点「私信」等 ≥5s，未出编辑器同页再点一次等 5.2s → fill 文案 → 600ms → Enter → 判定：编辑框清空 + 有我方文案 + 无「仅和他互关」= 送达。被拦不重试；仍有内容重试一次；**面板打不开可隔轮重试（实测有效）**，未送达不记入 ledger 的 dm:sent。
- 记账（scripts/ledger-update.mjs）：`ts/user/fans/sec/source/signal/segment/follow/dm/dmText/replied/classification/foundVia`。
- 背书轮换：外卡已服务上百家商户 / <COMPANY_BRAND_NAME·成立年·城市> / <渠道方名单> / <银行合作名单> / <标杆交付案例> / <服务规模>。
- 硬规则：文案 ≤120 字、重复率 <80%、第一句必须体现懂他做的生意。

## 回复监控（每 15 分钟，不占开发额度）
1. 打开私信管理列表，读每个会话最后一条与时间（snippets/read-chat-list.js）。
2. 与 ledger 中 `dmText/ourFollowUp` 比对：最后一条是对方发的 = 新回复。
3. **意向分类**：
   - **接受**（可跟，最多 1 条）：问费率/资料/开通条件/要方案/报业务类型或流水/问公司在哪/要见面。费率口径：「费率要按类目和走的通道定，我给报错后面还得改。你把业务类型和月流水量级发我，我出一版带费率的方案。」
   - **拒绝**（立即停跟，永不追加）：只回「谢谢/好的/收到/嗯/OK」且没回答提问；「不用了/再说/已解决」；要加 V 或发名片；明显厌烦。
   - **待观察**（不发消息，24h 内不重发）：只发表情/图片/自动回复。
   - **不算回复**：诚邀评价/智能客服结束/「在线/留对接方式」/关注触发的「新类型消息」推送。
   - **需人工介入**（不自行回复，记录+汇报标记）：要具体报价、签合同、开发票、上门、投诉、明确不满。
4. 回复 ≤100 字，一次只问 1–2 个问题。写回 ledger：`replied/repliedAt/replyContent/ourFollowUp`。
5. 每轮最多回复 5 个会话；无人回复只汇报「本轮无新回复」。

## 视频产线（每日 10:00，定位「获客辅助资产」）
**第 1 步 选题查重（最高优先级，不做完不许开工）**：打开 `video-topics.md`，核心痛点与已用条目对比，**只换措辞不算新题**（例：04「国外客户刷不了卡」与 10「外国客户想刷卡」重复）。未命中 → 登记（期号/日期/核心痛点/标题/状态=制片中）→ 做视频 → 完成后改「已用」。选题优先级：外卡新角度 > 分账 > 异地/远程。禁止泛泛支付常识。
**结构（32s）**：0–3s 钩子（具体现象+疑问）→ 3–25s 三个要点（一句人话+一个熟悉场景）→ 25–32s 收尾必须给低门槛动作（「私信说下你现在怎么收」），不写「欢迎咨询」。
**产线**：
1. HTML：复制 `pay-shorts\ep01.html` 改文案。自包含零外部资源、系统字体；`window.__meta={duration:32,width:1080,height:1920,fps:30}`；`window.__seek(t)` 纯函数；色板 `#2B2BFF/#FF5A4E/#FFC62B/#2EE6A8/#FFF6E9/#151433`。
2. 逐帧（snippets/capture-frames.js）：960 帧分 2 批各 480；**超时中断先数已有帧数从断点续，不要从头重跑**。
3. 编码：`ffmpeg -y -framerate 30 -i frames\epNN\f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -r 30 -movflags +faststart epNN-out.mp4` → 成功后删帧目录。
4. 配音：`eac_job_submit type=voice {text, voice:"mambo-zh", rate:3}`，projectId `<EAC_PROJECT_ID>`（eac_status 查询），轮询至终态。报 "fast-langdetect: Cache directory not found" → 把 `site-packages\fast_langdetect\resources\lid.176.ftz` 与 `NOTICE.MD` 复制到 `GPT-SoVITS\GPT_SoVITS\pretrained_models\fast_langdetect\` 重试。**不要用 render-template**（锁 1920×1080/10s 且缺字体）。
5. 混音：`ffmpeg -y -i epNN-out.mp4 -i voice.wav -c:v copy -c:a aac -b:a 128k -af "apad" -shortest -movflags +faststart epNN-final.mp4`。
6. ffprobe 必须确认 1080×1920 / 30fps / 32.000s / 有 audio 流。
7. 发布（snippets/upload-video.js）：复制 final.mp4 到 `profiles\desktop\.playwright-mcp\`（**上传有目录限制**）→ content/upload → `input[type=file]` setInputFiles → 填标题「支付常识 第NN期：<一句话>」→ 描述带 3+ 话题含行动指令 → 发布 → reload 作品列表确认出现（记作品总数与状态「审核中/已发布」）。
8. 记账：Node 写 video-episodes.json + topics 表改「已用」。
**汇报**：期号、查重对比、目标客群、真实 ffprobe 数值、配音是否曼波、发布是否核实。**不许把「渲染完成」说成「已发布」**。

## 日报（21:30）
1. 读 ledger.json / video-episodes.json，只依据真实数据，缺失写「无数据」，不编造。
2. 获客统计：今日新增/关注/送达/被拦/回复/送达率；累计总量与回复率；今日额度 x/20。
3. 视频复盘：打开 content/manage 滚动读近 3 期「支付常识」的播放/点赞/评论/完播率/2 秒跳出率（"--" 记无数据）；发布不足 24h 标「数据未稳定，仅供参考」；不满 3 期写「样本不足，仅记录不建议调整」。
4. 调整建议 ≤3 条，格式「把 X 改成 Y，因为 Z（引用具体数字）」，禁空话。
5. 输出 `reports\daily-YYYY-MM-DD.md`（7 段结构），对话里只给精简版。

## 已知坑（务必复用，不要重新踩）
- ledger/episodes JSON 一律 Node 写，禁 PowerShell Set-Content（BOM）。
- Playwright 默认 page 会被无关 tab 顶掉 → 永远 `ctx.pages().find(...)` + `bringToFront()`。
- 私信面板打不开 → 隔轮重试有效；被拦（「仅和他互关」）→ 不重试。
- 聊天列表偶发只渲染 76 字符 → reload + 等 15–30s 再读。
- 帧捕获超时 → 数已有帧从断点续。
- `render-template` 不可用于成片（分辨率/时长锁定、缺字体），用逐帧方案。
- 同一账号多机高频发私信会加重风控 → 每台电脑独立账号或只做监控/视频。
- 登录态存在本机浏览器 profile（`profiles\desktop\.playwright-mcp`），**不可跨机迁移**，新电脑需重新扫码。

## 新电脑部署
按 `setup.md` 执行：装依赖 → 建状态目录 → 扫码登录 → 用 `schedules\reminder-prompts.md` 的模板创建 4 个提醒任务（schedule_create：获客每 2h、回复监控每 15min、视频每日 10:00、日报每日 21:30）。

## 参考文件
- `snippets/`：search-candidates.js / send-dm.js / read-chat-list.js / upload-video.js / capture-frames.js
- `scripts/ledger-update.mjs`：ledger 追加与统计更新
- `templates/`：ledger.schema.json / video-topics.template.md / video-episodes.schema.json
- `schedules/reminder-prompts.md`：4 个定时提醒任务原文模板
- `setup.md`：新电脑完整部署步骤
