# douyin-outreach

抖音 B2B 私信获客自动化 + 行业科普短视频产线的 [DeepSeek Harness](https://github.com) 技能包（Skill）。

**行业无关（v2）**：技能本体不含任何行业假设。首次运行时 DSH 会询问你的行业、核心优势、目标客群、话术与合规口径，生成一份 `profile.yaml`；之后所有轮次（定时私信开发 → 回复意向分类 → 每日短视频 → 数据日报）都按这份档案执行。支付服务商只是 [示例档案](profiles/example.profile.yaml)——做财税、SaaS、物流、装修、任何 B2B 行业都可以用同一个技能。换行业 = 重跑一次引导，历史台账保留。

> ⚠️ **免责声明**：本项目是流程自动化与文档编排的参考实现，不隶属于任何平台。批量私信、自动化操作可能违反目标平台的用户协议并导致限流/封号；面向客户的行业案例、经营数据、话术事实必须由使用者自行核实并承担合规责任。请仅用于你自己拥有或有权运营的账号，并遵守当地法律与平台规则。作者不提供任何营销效果保证。

## 目录结构

```
douyin-outreach/
├── SKILL.md                    # 主 SOP：首次引导 / 获客轮 / 回复监控 / 视频产线 / 日报 / 踩坑清单
├── setup.md                    # 新电脑部署：依赖 → 技能安装 → 首次引导 → 扫码 → 定时任务
├── profiles/
│   └── example.profile.yaml    # 完整 profile 示例（支付行业示范；你的会被引导生成到状态目录）
├── schedules/
│   └── reminder-prompts.md     # 获客(每2h) / 监控(每15min) / 视频(10:00) / 日报(21:30) 四个任务模板（profile 驱动）
├── snippets/                   # Playwright 代码片段（browser_run_code_unsafe 直接可用）
│   ├── search-candidates.js    # 搜索页抓候选商家（CONFIG 从 profile 注入：keywords/peerRegex/fans）
│   ├── send-dm.js              # 关注 → 私信 → 发送 → 送达判定（文案由上层按 profile 组装）
│   ├── read-chat-list.js       # 读会话列表（含短渲染重试）
│   ├── capture-frames.js       # HTML 动画逐帧截图（断点续帧）
│   └── upload-video.js         # 上传 → 填标题描述 → 发布 → 作品列表回读核实
├── scripts/
│   └── ledger-update.mjs       # 台账读写（add / reply / stats），BOM 安全
└── templates/
    ├── ledger.schema.json      # 台账空模板（规则字段运行时由 profile 注入）
    ├── video-master.html       # 1080×1920 / 32s 视频母版（改文案区+配色区即可换行业）
    ├── video-topics.template.md# 选题查重表
    └── video-episodes.schema.json # 视频期数记录模板
```

## 快速开始

1. 解压/克隆到目标机器的 `<DSH home>/skills/douyin-outreach/`
2. 在 DSH 会话里说：**「运行 douyin-outreach，首次部署」**
3. 接下来只有三件事：
   - **回答行业引导问题**（哪个行业、卖什么、优势背书、目标客群怎么搜、什么不能说）→ 技能生成你的 `profile.yaml`
   - **扫码登录一次**（登录态存于本机浏览器 profile，不跨机迁移）
   - 按 `schedules/reminder-prompts.md` 建 4 个 `schedule_create` 任务（prompt 已 profile 驱动，无需改文案）

换行业：说「douyin-outreach 换行业」重跑引导即可，定时任务与历史台账不动。

## 设计要点（踩过的坑都在 SOP 里）

- **台账只用 Node 写**：PowerShell `Set-Content` 的 BOM 会炸掉 `JSON.parse`
- **页面抢占防御**：永远 `page.context().pages().find(...)` + `bringToFront()`
- **意向四分类**：接受 / 拒绝 / 待观察 / 需人工介入；对方不答问题就绝不追问第二条
- **面板打不开隔轮重试**（实测有效）；「仅和他互关」= 被拦则永不重试
- **视频发布必须回读作品列表核实**——渲染完成 ≠ 已发布
- **合规写进规则而不是靠自觉**：禁报费率数字、禁到账承诺、禁绝对化用语

## 视频产线

自包含 HTML 动画（`window.__seek(t)` 纯函数）→ Playwright 1080×1920 逐帧截图 960 帧 →
ffmpeg libx264 → 本地 TTS 配音（默认 GPT-SoVITS，可回退系统 TTS/静音）→ aac 混音 →
ffprobe 校验 → 创作者中心上传发布。

## 相关项目（同类技能包）

- [weibo-outreach](https://github.com/Buer5460/weibo-outreach)：同架构的微博版获客（如已发布）

## License

[MIT](LICENSE)
