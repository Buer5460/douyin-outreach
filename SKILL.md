---
name: douyin-outreach
description: 抖音 B2B 私信获客自动化 + 行业科普短视频产线（行业无关）。首次运行会自动询问用户所在行业、核心优势与目标客群，生成 profile.yaml，之后按该档案执行定时私信开发、回复意向监控分类、每日行业科普短视频（HTML→逐帧→ffmpeg→本地TTS配音→上传发布）与每日数据日报。触发词：抖音获客、私信监控、科普视频、获客日报、douyin outreach。
---

# 抖音获客自动化 + 视频产线（行业无关，profile 驱动）

## 定位
对本机登录的抖音账号执行两类自动化：① B2B 商家私信开发与回复监控；② 每日一条行业科普短视频（获客辅助资产）。
**具体做什么行业、找什么客群、用什么话术，全部来自 `<STATE_DIR>\profile.yaml`，本 SOP 不假设行业。**
所有执行状态落盘到 `<STATE_DIR>`（默认 `<DSH_HOME>\douyin-outreach\`，可在 profile.yaml 改）。

## 第 -1 步｜首次运行引导（profile.yaml 不存在时，必须先做，做完才允许任何轮次）
1. 检查 `<STATE_DIR>\profile.yaml`。存在 → 读取并跳到「第 0 步」。
2. 不存在 → 用 ask_user_question 逐项问清（一次问完，缺项再补问；不允许自己编）：
   - **行业与公司**：工商全称、品牌名、官网域名（可空）
   - **你卖什么**：核心产品/服务 + 你最想主打的一项真实优势（含可验证的数量背书，如「已服务 XX 家同类客户」）
   - **目标客群**：2–4 个客群分层，每层给出：抖音搜索词（3–10 个）、客户典型痛点、低门槛开口问题（1–2 个）
   - **同行排除**：哪些账号昵称特征算同行/竞对（给正则或关键词）
   - **报价与合规**：能否报价格数字？哪些承诺不能说（到账/审批/疗效/收益等）？能否留联系方式、用什么口径？
   - **视频选题**：日常客户最常问的 3 个问题、想科普的选题方向（无视频需求可答「跳过视频」）
   - **额度**：日私信上限（默认 20，提示按账号权重调低）
3. 按 `profiles/example.profile.yaml` 的结构生成 `profile.yaml` 写入 `<STATE_DIR>`，向用户回读一遍要点请其确认。
4. 依据 profile 初始化状态文件：ledger.json（templates/ledger.schema.json 复制，segments 字段改为从 profile 注入）、video-topics.md（选题池从 profile 填）、video-episodes.json、reports\。
5. 提醒用户：`schedules/reminder-prompts.md` 的 4 个定时任务已写成「按 profile 执行」，直接创建即可，无需再改文案。

> 任何时候用户说「换行业 / 改客群 / 改话术」，就重跑本节引导并覆盖 profile.yaml，历史台账保留。

## 第 0 步：环境检查（每次会话先做）
1. 确认工具可用：Playwright MCP（browser_*）、PowerShell、Node。
2. **确认 `<STATE_DIR>\profile.yaml` 存在**；不存在 → 回到「第 -1 步」。
3. 确认状态文件齐备：ledger.json、video-topics.md、video-episodes.json、reports\。
4. 确认 ffmpeg 在 PATH；若 profile.video.enabled 且有 EAC：eac_status 查 projectId 与 TTS 可用性。
5. 登录态检查：打开 `https://creator.douyin.com/creator-micro/data/following/chat` 等 15s。出现「扫码登录/验证码登录」→ 截图 `douyin-login.png`，报「需人工扫码」，本轮结束。

## 铁律（任何时候不可违反）
- **安静时段**：profile.limits.quiet_hours（默认北京时间 22:00–07:00）不执行任何轮次。
- **合规红线 = profile.compliance**：按引导时用户确认的口径执行；通用底线不变——不用绝对化用语、不虚构事实、不教规避平台规则；具体禁项（价格数字/承诺类型/联系方式口径）逐条来自 profile。
- **回复铁律**：对方不答我方问题就不许追问第二条；同一用户 24h 内我方消息 ≤2 条；我方每条消息必须带一个明确问题。
- **记账**：ledger.json 只用 Node 写（PowerShell Set-Content 会产生 BOM 导致解析失败）。
- **多标签页**：永远 `page.context().pages().find(p=>p.url().includes(...))` 找目标 tab 再 `bringToFront()`。

## 获客轮（每 2 小时：7/9/11/13/15/17/19/21）
**目标：拿到能对话的真买家，不是凑发送量。**
- 限流：日限 profile.limits.daily_quota；已发 ≥ profile.limits.stop_threshold 停止新触达。
- 第一优先级：主动来消息的人（见「回复监控」分类处理），高于一切开发。
- 选人（snippets/search-candidates.js）：搜索词从 **profile.segments[].keywords** 轮换；筛粉丝 1–20 万；按 **profile.peer_exclude_regex** 排除同行；认证徽章或公司字样优先。
- **客群配额**：按 profile.segments 的 share 字段分配（默认主客群 2/3、次客群 1/3）。
- **开场文案模板**（每轮从对应 segment 取）：
  `你好，看你是做{对方业务特征}的。{该 segment 的痛点句}。{优势背书句（profile.endorsement，只陈述可验证事实）}。想问下{该 segment 的低门槛问题}？`
  硬规则：≤120 字、同轮重复率 <80%、第一句必须体现懂他做的生意。**所有事实必须来自 profile，禁止临场编造数字。**
- 执行（snippets/send-dm.js）：开 user 页等 ≥4.5s → 点 `[data-e2e="user-info-follow-btn"]` 变「已关注」→ 点「私信」等 ≥5s，未出编辑器同页再点一次等 5.2s → fill 文案 → 600ms → Enter → 判定：编辑框清空 + 有我方文案 + 无「仅和他互关」= 送达。被拦不重试；仍有内容重试一次；**面板打不开可隔轮重试（实测有效）**，未送达不记入 ledger 的 dm:sent。
- 记账（scripts/ledger-update.mjs）：`ts/user/fans/sec/source/signal/segment/follow/dm/dmText/replied/classification/foundVia`。
- 轮换防疲劳：连续 2 轮某 segment 回复率为 0 → 该轮降权，把名额给回复率更高的 segment（数据从 ledger 统计）。

## 回复监控（每 15 分钟，不占开发额度）
1. 打开私信管理列表，读每个会话最后一条与时间（snippets/read-chat-list.js）。
2. 与 ledger 中 `dmText/ourFollowUp` 比对：最后一条是对方发的 = 新回复。
3. **意向分类**（分类框架行业通用；「接受」的具体信号词可按 profile 增补）：
   - **接受**（可跟，最多 1 条）：问价格/资质/材料/开通条件、要方案、自报业务规模、问公司在哪、要约见面。价格类问题的标准口径按 **profile.compliance.quote_script** 回（不给具体数字时，索取需求信息出方案）。
   - **拒绝**（立即停跟，永不追加）：只回「谢谢/好的/收到/嗯/OK」且没回答提问；「不用了/再说/已解决」；索要私人联系方式（若 profile 规定不给）；明显厌烦。
   - **待观察**（不发消息，24h 内不重发）：只发表情/图片/自动回复。
   - **不算回复**：诚邀评价/智能客服结束/关注触发的「新类型消息」推送。
   - **需人工介入**（不自行回复，记录+汇报标记）：要具体合同/发票/上门、投诉、明确不满、以及 profile 标出的其它高敏请求。
4. 回复 ≤100 字，一次只问 1–2 个问题。写回 ledger：`replied/repliedAt/replyContent/ourFollowUp`。
5. 每轮最多回复 5 个会话；无人回复只汇报「本轮无新回复」。

## 视频产线（每日 10:00；profile.video.enabled=false 则整节跳过）
**第 1 步 选题查重（最高优先级）**：打开 `video-topics.md`，核心痛点与已用条目对比，**只换措辞不算新题**。未命中 → 登记（期号/日期/核心痛点/标题/状态=制片中）→ 做 → 完成改「已用」。选题从 **profile.video.topic_pool** 选，优先级：最能体现我方优势的方向 > 客户高频问题 > 其他。禁止泛泛常识。
**结构（32s）**：0–3s 钩子（具体现象+疑问）→ 3–25s 三个要点（一句人话+一个熟悉场景）→ 25–32s 收尾必须给低门槛动作（按 profile.video.cta，例「私信说下你的情况」），不写「欢迎咨询」。
**产线**：
1. HTML：复制母版（templates/video-master.html，源自 1080×1920 支付母版，可整体换配色文案）改内容。自包含零外部资源、系统字体；`window.__meta={duration:32,width:1080,height:1920,fps:30}`；`window.__seek(t)` 纯函数。
2. 逐帧（snippets/capture-frames.js）：960 帧分 2 批各 480；**超时中断先数已有帧数从断点续**。
3. 编码：`ffmpeg -y -framerate 30 -i frames\epNN\f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -r 30 -movflags +faststart epNN-out.mp4` → 成功后删帧目录。
4. 配音：有 EAC+GPT-SoVITS → `eac_job_submit type=voice`（projectId/voice 从 profile.eac 取）；否则系统 TTS（PowerShell System.Speech）或静音交付并在日报注明。**不要用 render-template**（锁 1920×1080/10s 且缺字体）。GPT-SoVITS 报 fast-langdetect 缓存缺失 → 复制 `lid.176.ftz` 到 `pretrained_models\fast_langdetect\` 重试。
5. 混音：`ffmpeg -y -i epNN-out.mp4 -i voice.wav -c:v copy -c:a aac -b:a 128k -af "apad" -shortest -movflags +faststart epNN-final.mp4`。
6. ffprobe 必须确认 1080×1920 / 30fps / 32.000s / 有 audio 流（静音版允许无 audio，注明）。
7. 发布（snippets/upload-video.js）：复制 final.mp4 到 `profiles\desktop\.playwright-mcp\`（**上传有目录限制**）→ content/upload → setInputFiles → 填标题「{profile.video.title_prefix} 第NN期：<一句话>」→ 描述带 3+ 话题含行动指令 → 发布 → reload 作品列表确认出现。
8. 记账：Node 写 video-episodes.json + topics 表改「已用」。
**汇报**：期号、查重对比、目标客群、真实 ffprobe 数值、配音引擎、发布是否核实。**不许把「渲染完成」说成「已发布」**。

## 日报（21:30）
1. 读 ledger.json / video-episodes.json，只依据真实数据，缺失写「无数据」，不编造。
2. 获客统计：今日新增/关注/送达/被拦/回复/送达率；累计与回复率；额度 x/N（N 来自 profile）。
3. 视频复盘（如启用）：读近 3 期播放/点赞/评论/完播率/2 秒跳出率（"--" 记无数据）；发布不足 24h 标「数据未稳定」；不满 3 期写「样本不足，仅记录不建议调整」。
4. 调整建议 ≤3 条，格式「把 X 改成 Y，因为 Z（引用具体数字）」，禁空话。特别对比 **各 segment 的回复率**，建议轮转名额。
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
- 陌生消息但非目标客群（如索要私人联系方式的推销）：记入 ledger 标「拒绝/非客群」，不回复，不计新事件。

## 新电脑部署
按 `setup.md` 执行：装依赖 → 首次对话触发「第 -1 步引导」建 profile → 扫码登录 → 创建 4 个提醒任务。

## 参考文件
- `profiles/example.profile.yaml`：完整 profile 示例（支付行业示范）
- `snippets/`：search-candidates.js / send-dm.js / read-chat-list.js / upload-video.js / capture-frames.js
- `scripts/ledger-update.mjs`：ledger 追加与统计更新
- `templates/`：ledger.schema.json / video-topics.template.md / video-episodes.schema.json / video-master.html
- `schedules/reminder-prompts.md`：4 个定时提醒任务模板（profile 驱动版）
- `setup.md`：新电脑完整部署步骤
