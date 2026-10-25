# Nihongo Stack 应用说明

当前开发版为 0.7.0。它是一套本机优先的 Mac 日语学习应用，前端同时可以构建为浏览器版本。

产品总览、模块说明和截图入口见仓库根目录的 [README](../../README.md)。

## 使用路径

1. 第一次打开时，可先做六题起点小测。不会的题选“不知道”，结果只用于定位基础缺口。
2. 在首页查看今日任务、到期卡、新卡额度和剩余估时。
3. 按顺序完成复习、阅读和听音；时间不足时跳过或延期，并记录原因。
4. 在卡片库检索、筛选和收藏词条；在进度页查看错题、活跃时间和一周回顾。
5. 在 JLPT 练习页选择等级与年份，练习原创教学题，或导入自己有权使用的完整题库。
6. 定期在设置中导出 JSON。恢复前会显示双方记录数量，并保留导入前副本。

## 学习层与注音

阅读、听音文本、卡片例句、课程要点和 JLPT 学习题共用同一套学习层。显示顺序固定为罗马音在上、平假名位于汉字上方、释义或语法位于原文下方。考试模式保留原文。

FuriFont Serif 随应用离线提供，可选择材料注音或字体注音。字体失效时会显示错误和重试入口。

## 内容范围

- 7 个连续基础单元
- 62 张卡片
- 9 篇阅读材料
- 10 段本地音频
- 28 个年份与等级 JLPT 学习索引
- 64 道原创 JLPT 分级教学题

原创内容尚未经过专业日语教师审校。内置新增听力是明确标注的 macOS Kyoko 合成语音，不用于判断真人听力水平。

JLPT 页提供官方公开资料入口，也支持本机导入有使用依据的完整题库。导入器会检查题数、分区、题号、教学层、听力音频和使用依据；导入内容只保存在本机。详细说明见 [私有 JLPT 资源说明](../../docs/content/PRIVATE_JLPT_RESOURCES.md)。

## 数据兼容

- 应用标识：`com.nihongostack.desktop`
- IndexedDB：`nihongo-stack-codex`
- 备份格式：JSON，恢复前预览并保留本机副本
- MyGo 页面来源：`mygo://localhost/`

旧 Tauri 版的数据不会因应用名称相同而自动出现在 MyGo 版中。需要迁移时，先在旧应用导出 JSON，再在新版导入。

## 开发命令

在 `apps/nihongo-stack/` 运行：

```sh
npm ci
npm run dev
npm run mygo:dev
npm run build
npm run mygo:vet
npm run mygo:build
```

构建产物：

```text
apps/nihongo-stack/Nihongo Stack.app
```

构建脚本会同步正式 `.app`，并删除中间目录里的同名临时应用，避免 Spotlight 出现多个入口。

## 验证

```sh
npm run test:db
npm run test:learning
npm run test:content
npm run test:language
npm run test:jlpt
npm run test:study-plan
npm run build
npm run mygo:vet
npm run mygo:build
codesign --verify --deep --strict 'Nihongo Stack.app'
```

`test:content` 检查内容指纹、ID、引用、题目、试听标签和音频解码。`test:learning` 检查播放覆盖、跳播缺口、暂停恢复、辅助证据和复习队列。`test:db` 使用内存 IndexedDB，不写入真实学习记录。

## 原生窗口验收

macOS 屏幕共享或 Computer Use 控制提示会覆盖窗口左上角，截图里可能显示为紫色胶囊。这不是应用的交通灯，也不能用这类截图判断按钮形态。

应用目前只有浅色界面，因此原生窗口也通过 `ThemeLight` 固定为浅色外观。系统切换到深色模式时，交通灯和系统控件不会单独换成深色样式。

窗口失焦时 macOS 会把交通灯降为灰色，这是系统行为。原生窗口应在没有自动化覆盖层时手动激活并单独截图。应用本身使用 `TitleBarHidden`、AppKit `standardWindowButton` 和 `TrafficLightPosition`，不绘制或仿制红黄绿按钮。详细记录见 [MyGo 迁移与原生窗口验收](../../docs/mygo-migration.md)。
