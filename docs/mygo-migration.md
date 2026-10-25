# Nihongo Stack 与 MyGo

当前版本使用 MyGo 0.6.4 作为 macOS 桌面壳，React/Vite 前端、Dexie 数据库、FSRS 排程、学习内容和浏览器构建继续共用同一套业务代码。

## 当前入口

- 配置：`apps/nihongo-stack/mygo.config.ts`
- 原生入口：`apps/nihongo-stack/main.go`
- 开发：`npm run mygo:dev`
- 原生检查：`npm run mygo:vet`
- macOS 打包：`npm run mygo:build`
- 浏览器包：`npm run mygo:build:web`
- 产物：`apps/nihongo-stack/Nihongo Stack.app`；构建目录中的临时 `.app` 会在同步后删除，避免 Spotlight 出现重复入口

MyGo 原生入口使用 `TitleBarHidden` 保留 AppKit 的标准窗口按钮。交通灯由 macOS 原生绘制，并通过 `TrafficLightPosition` 定位在左上角。页面的 `.topbar` 直接使用 MyGo 注入的 `--mygo-titlebar-*` 安全区延伸到标题栏区域；前端不绘制或仿制交通灯，也不额外改写 AppKit toolbar 样式。

当前产品只有浅色界面，入口在启动时调用 `mygo.Theme.SetSource(mygo.ThemeLight)`，窗口底色固定为 `#f4f2ed`。这样系统切到深色模式时，AppKit 标题栏、交通灯和系统控件不会与浅色页面出现外观分裂。窗口的 focus/blur 继续转为 `nihongo-native-focus` 事件，学习计时继续由前端 `activity.ts` 维护。

## 原生交通灯验收

2026-10-26 复查分成两部分。

第一，Codex Computer Use 或 macOS 屏幕共享保护层会在窗口左上角叠加紫色胶囊，覆盖真实交通灯。该胶囊不属于应用界面，不能用于判断按钮形态。此前把这张受控窗口截图当作应用外观，导致一部分无效修改。

第二，应用原先跟随系统深色外观，但页面 CSS 固定为浅色。系统切到深色时，AppKit 控件与浅色页面发生外观分裂。现已通过 `ThemeLight` 和固定浅色窗口底色收口。

窗口失焦时，macOS 会把交通灯降为灰色。这是正常状态，不是应用自定义的扁平样式。

后续验收要在没有自动化覆盖层时手动启动并激活应用。先分别检查系统浅色和深色模式下的激活、失焦状态，再通过 `standardWindowButton` 的尺寸、可见性和位置核对原生控件。

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
npm run test:study-plan
npm run build
npm run mygo:vet
npm run mygo:build
codesign --verify --deep --strict 'Nihongo Stack.app'
```

2026-10-25 已验证 MyGo 原生窗口实际打开、工作台、阅读、听力、音频播放、原生下拉菜单和 FuriFont 注音。2026-10-26 再次核对原生交通灯、当前界面截图和 README 内容。Tauri 目录已从当前实现移除，旧版本交付文档保留为历史记录。
