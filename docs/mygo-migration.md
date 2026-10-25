# Nihongo Stack · MyGo 迁移记录

当前版本使用 MyGo 0.6.4 作为 macOS 桌面壳，React/Vite 前端、Dexie 数据库、FSRS 排程、学习内容和浏览器构建继续共用同一套业务代码。

## 当前入口

- 配置：`apps/nihongo-stack/mygo.config.ts`
- 原生入口：`apps/nihongo-stack/main.go`
- 开发：`npm run mygo:dev`
- 原生检查：`npm run mygo:vet`
- macOS 打包：`npm run mygo:build`
- 浏览器包：`npm run mygo:build:web`
- 产物：`apps/nihongo-stack/build/mygo/darwin-arm64/`，并同步到 `apps/nihongo-stack/Nihongo Stack.app`

MyGo 原生入口只负责创建窗口、保存窗口状态、把隐藏标题栏的交通灯放进软件顶部工作栏，并把窗口的 focus/blur 转为 `nihongo-native-focus` 事件。学习计时继续由前端 `activity.ts` 维护，避免把业务逻辑放进桌面壳。

## 数据兼容

数据库名称仍为 `nihongo-stack-codex`，备份 JSON schema 不变。MyGo 页面来源是 `mygo://localhost/`，旧 Tauri 页面来源不同，因此系统不会假定两者共享 IndexedDB。已有学习数据应在旧应用中导出 JSON，再在 MyGo 版设置中导入一次；导入前仍会创建本机副本。

## 验收命令

```sh
npm ci
npm run test:db
npm run test:learning
npm run test:content
npm run test:language
npm run test:jlpt
npm run build
npm run mygo:vet
npm run mygo:build
codesign --verify --deep --strict 'build/mygo/darwin-arm64/Nihongo Stack.app'
```

2026-10-25 已验证 MyGo 原生窗口实际打开、工作台、阅读、听力、音频播放、原生下拉菜单和 FuriFont 注音。Tauri 目录已从当前实现移除，旧版本交付文档保留为历史记录。
