# Nihongo Stack v0.10.0

本版本从用户任务流重新整理应用界面，重点是减少重复入口、减少无效说明和降低页面之间的往返操作。

## 交付内容

- 首页只保留当前单元、随手学一题和今日详解三个任务区域。
- 当前单元内直接提供复习、阅读、听力和换单元动作；侧栏负责完整页面导航。
- 移除首页五个重复入口和顶部重复设置按钮；计时器保留在设置按钮上方。
- 删除首页建议学习时长设置，不引入每日学习量或上限。
- 统一全局文字档位和中文、日文断行规则，降低少字孤行与 ruby 错位。
- 更新透明外部背景的「あ」书本图标，MyGo 使用 `assets/app-icon-v1.0.png`。

## 验证

- `npm run build`
- `npm run test:learning`
- `npm run test:content`
- `npm run test:db`
- `npm run test:language`
- `npm run test:jlpt`
- `npm run test:study-plan`
- `git diff --check`
- `npm run mygo:build`
- `codesign --verify --deep --strict 'Nihongo Stack.app'`
- 浏览器验收：1440×900、1024×700、800×600、375×812；首页无主内容滚动，首页入口栏数量为 0，移动端无横向溢出。

## 本地产物

- `apps/nihongo-stack/Nihongo Stack.app`
- `apps/nihongo-stack/build/mygo/darwin-arm64/Nihongo Stack 0.10.0 arm64.dmg`

当前 macOS 包使用本机临时签名，未进行 Apple 公证。
