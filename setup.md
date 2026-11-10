# 新电脑部署指南（douyin-outreach skill）

## 1. 前置依赖
| 依赖 | 用途 | 安装 |
|------|------|------|
| Node.js ≥18 | ledger/episodes JSON 读写（BOM 安全） | https://nodejs.org LTS |
| ffmpeg（在 PATH） | 视频编码/混音 | `winget install Gyan.FFmpeg` 或下载 gyan.dev full build |
| DeepSeek Harness (DSH) | Playwright MCP、schedule_create、技能加载 | 已装则跳过 |
| EAC design world + GPT-SoVITS（可选） | 曼波中文配音；不带则视频用系统 TTS 或静音 | 最重依赖：需 VS Build Tools 2022 + torch 2.5.1 + torchaudio 2.5.1；不配音可跳过 |

验证：`node -v`、`ffmpeg -version` 都能输出版本。

## 2. 建状态目录
```
<GDSH_HOME>\douyin-outreach\
├── ledger.json            # 从 templates/ledger.schema.json 复制，stats 归零
├── video-topics.md        # 从 templates/video-topics.template.md 复制
├── video-episodes.json    # 从 templates/video-episodes.schema.json 复制（episodes:[]）
└── reports\               # 空目录
```
`<GDSH_HOME>` 是本机 DSH home（本机示例 `<DSH_HOME>`）。SKILL.md 中所有写死的路径按本机实际路径替换。

## 3. 登录抖音账号
1. 打开 DSH，确认 Playwright MCP 可用。
2. 用浏览器打开 `https://creator.douyin.com/creator-micro/data/following/chat`，出现二维码后**人工手机扫码**。
3. 登录态保存在 `profiles\desktop\.playwright-mcp\` 的浏览器 profile，之后自动复用。
4. ⚠️ 每台电脑必须用**独立账号**登录；同账号多机高频发私信会显著加重风控。只做监控/视频的电脑可以和开发机共用账号（不互发）。

## 4. 视频素材目录（可选，做视频才需要）
- 复制 `pay-shorts\ep01.html`（母版模板）到本机任意目录，后续每期复制改文案。
- SKILL.md 产线一节的 file:// 路径替换为本机路径。

## 5. 创建定时提醒任务
在 DSH 会话里依次调用 `schedule_create`，prompt 原文从 `schedules\reminder-prompts.md` 复制，rrule 按模板：

| 任务 | rrule | target |
|------|-------|--------|
| 获客轮（每2h） | `DTSTART;TZID=Asia/Shanghai:YYYYMMDDT070000\nRRULE:FREQ=HOURS;INTERVAL=2` （小时限制见模板内说明） | this_session |
| 回复监控（每15min，白天） | `DTSTART;TZID=Asia/Shanghai:YYYYMMDDT091500\nRRULE:FREQ=MINUTELY;INTERVAL=15` | this_session |
| 视频（每日10:00） | `DTSTART;TZID=Asia/Shanghai:YYYYMMDDT100000\nRRULE:FREQ=DAILY` | this_session |
| 日报（每日21:30） | `DTSTART;TZID=Asia/Shanghai:YYYYMMDDT213000\nRRULE:FREQ=DAILY` | this_session |

> 安静时段（22:00–07:00）保护已写在每个 prompt 的最高优先级段，即使 rrule 触发了也会自动空转。

## 6. 冒烟测试
1. 手动执行一次「回复监控」：能读出会话列表即通过。
2. 手动执行一次「获客轮」：发 1 条私信到测试目标，ledger 出现 `dm:"sent"` 记录即通过。
3. （可选）做一期视频走完整产线，作品列表能看到即通过。

## 7. 常见问题
- **页面报 Execution context destroyed**：用 `page.context().pages().find(...)` 找目标 tab。
- **JSON 解析失败**：检查是否用 PowerShell Set-Content 写过（BOM），改用 Node 重写。
- **配音报 fast-langdetect**：见 SKILL.md 视频产线第 4 步的缓存修复。
- **发布按钮点了没反应**：重试填标题/描述后先等 2s 再点；或截图看是否有弹窗。
