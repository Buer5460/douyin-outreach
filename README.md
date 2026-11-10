# douyin-outreach

抖音商家 **B2B 私信获客自动化 + 支付科普短视频产线** 的 [DeepSeek Harness](https://github.com) 技能包（Skill）。

把「定时私信开发 → 回复意向分类 → 每日短视频 → 数据日报」整套 SOP 固化为可复用的技能：
其他装了 DSH 的电脑解压即装，按 `setup.md` 扫码登录 + 建 4 个定时任务即可跑起来。

> ⚠️ **免责声明**：本项目是流程自动化与文档编排的参考实现，不隶属于任何平台。批量私信、自动化操作可能违反目标平台的用户协议并导致限流/封号；面向客户的行业案例、经营数据、话术事实必须由使用者自行核实并承担合规责任。请仅用于你自己拥有或有权运营的账号，并遵守当地法律与平台规则。作者不提供任何营销效果保证。

## 目录结构

```
douyin-outreach/
├── SKILL.md                    # 主 SOP：铁律 / 获客轮 / 回复监控 / 视频产线 / 日报 / 踩坑清单
├── setup.md                    # 新电脑部署：依赖 → 建目录 → 扫码 → 定时任务 → 冒烟测试
├── config.example.yaml         # 运行配置模板（复制为 config.local.yaml 填写，勿提交）
├── schedules/
│   └── reminder-prompts.md     # 获客(每2h) / 监控(每15min) / 视频(10:00) / 日报(21:30) 四个任务原文
├── snippets/                   # Playwright 代码片段（browser_run_code_unsafe 直接可用）
│   ├── search-candidates.js    # 搜索页抓候选商家（粉丝过滤 + 同行排除）
│   ├── send-dm.js              # 关注 → 私信 → 发送 → 送达判定
│   ├── read-chat-list.js       # 读会话列表（含短渲染重试）
│   ├── capture-frames.js       # HTML 动画逐帧截图（断点续帧）
│   └── upload-video.js         # 上传 → 填标题描述 → 发布 → 作品列表回读核实
├── scripts/
│   └── ledger-update.mjs       # 台账读写（add / reply / stats），BOM 安全
└── templates/
    ├── ledger.schema.json      # 私信台账空模板（含规则与踩坑字段）
    ├── video-topics.template.md# 选题查重表
    └── video-episodes.schema.json # 视频期数记录模板
```

## 快速开始

1. 解压到目标机器的 `<DSH home>/skills/douyin-outreach/`
2. 会话里执行：`按 douyin-outreach 技能的 setup.md 部署`
3. 关键动作只有三个：
   - **扫码登录一次**（登录态存于本机浏览器 profile，不跨机迁移）
   - 把 `SKILL.md` 里的 `<占位符>` 替换为你的业务事实，或写入 `config.local.yaml`
   - 按 `schedules/reminder-prompts.md` 建 4 个 `schedule_create` 任务

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
