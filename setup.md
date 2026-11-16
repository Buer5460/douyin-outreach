# 新电脑部署指南（douyin-outreach skill · v2 行业无关版）

## 0. 这套技能怎么做到"什么行业都能用"
技能本体（SKILL.md + snippets + 定时模板）**不含任何行业假设**。
行业、客群、搜索词、话术、背书、合规口径、视频选题全部集中在一份 **`profile.yaml`**：
- 第一次在 DSH 里说「douyin-outreach 帮我部署获客」→ 技能自动触发「第 -1 步首次运行引导」
- DSH 会问你：哪个行业、卖什么、优势、目标客户怎么搜、什么不能说 → 生成你的 `profile.yaml`
- 之后所有轮次只按这份档案执行；换行业 = 重说「换行业」重跑引导

## 1. 前置依赖
| 依赖 | 用途 | 安装 |
|------|------|------|
| Node.js ≥18 | 台账 JSON 读写（BOM 安全） | https://nodejs.org LTS |
| ffmpeg（PATH） | 视频编码/混音 | `winget install Gyan.FFmpeg` |
| DeepSeek Harness | Playwright MCP、schedule_create、技能加载 | 已装跳过 |
| EAC design world + GPT-SoVITS（可选） | 本地音色配音；不装则系统 TTS/静音 | 最重依赖，可跳过 |

验证：`node -v`、`ffmpeg -version` 有输出即可。

## 2. 安装技能
把本仓库内容放到本机 DSH 技能目录：
```
<DSH home>\skills\douyin-outreach\
```
`<DSH home>` 默认在 `~\.dsh-home`（Windows：`C:\Users\<你>\.dsh-home`），不确定就在 DSH 会话里问。

## 3. 首次引导（替代旧版的手工建目录）
在 DSH 会话里说：**「运行 douyin-outreach，首次部署」**。
技能会：
1. 逐项询问行业档案（见 profiles/example.profile.yaml 了解会被问什么）
2. 生成 `<DSH home>\douyin-outreach\profile.yaml`
3. 初始化 ledger.json / video-topics.md / video-episodes.json / reports\

回答时注意：
- **背书数字必须真实**（如"服务过多少客户"），话术只陈述 profile 里的事实
- 不想做视频 → video 一项答「跳过」即可
- 日额度按自己账号情况填，新号建议 ≤10

## 4. 扫码登录抖音
1. DSH 浏览器打开 `https://creator.douyin.com/creator-micro/data/following/chat`
2. 出现二维码 → **人工手机扫码**
3. 登录态存在本机 `profiles\desktop\.playwright-mcp\`，之后自动复用
4. ⚠️ 登录态不可跨机迁移；每台电脑独立账号（同账号多机高频私信会触发风控）

## 5. 创建 4 个定时任务
prompt 原文与 rrule 在 `schedules/reminder-prompts.md`（已是 profile 驱动版，**不含行业词，无需修改**），依次 `schedule_create`：

| 任务 | 频率 | 说明 |
|------|------|------|
| 获客轮 | 每 2h（7–21 点） | 自动读 profile 选人、发私信 |
| 回复监控 | 每 15min | 意向分类 + 合规回复 |
| 视频 | 每日 10:00 | profile.video.enabled=false 自动跳过 |
| 日报 | 每日 21:30 | 真实数据统计 |

## 6. 冒烟测试
1. 手动跑一次「回复监控」→ 能读出会话列表即通过
2. 手动跑一次「获客轮」→ ledger 出现 `dm:"sent"` 记录即通过
3. （启用视频）跑完整产线，作品列表可见即通过

## 7. 常见问题
- **页面报 Execution context destroyed** → `page.context().pages().find(...)` 找目标 tab
- **JSON 解析失败** → 检查是否被 PowerShell 写过（BOM），用 Node 重写
- **列表只有 76 字符** → reload + 等 20–30s
- **想换行业** → 对 DSH 说「douyin-outreach 换行业」，重跑第 -1 步引导覆盖 profile.yaml
