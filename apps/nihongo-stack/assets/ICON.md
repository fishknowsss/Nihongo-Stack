# Nihongo Stack v0.3 图标

内置 `image_gen` 生成，2026-10-08。米白圆角底板、朱红叠放书页、抽象「日」和书签。原稿为透明 PNG；网页尺寸沿用 `public/` 资源，MyGo 从 `assets/app-icon-v0.3.png` 生成 macOS 应用图标。

- 原稿：`app-icon-v0.3.png`
- 侧栏：`../public/app-icon-128.png`
- favicon：`../public/favicon-32.png`
- 桌面：`app-icon-v0.3.png`，由 `mygo.config.ts` 作为 MyGo 应用图标使用。
- 旧 v0.2 图标随旧程序保存在项目 `output/product-improvement/2026-10-08/before/`。

生成提示词：

```text
Use case: logo-brand.
Asset type: finished macOS application icon for Nihongo Stack, a private Japanese study app.
Create one square premium macOS icon, isolated on actual transparent background. A warm ivory softly rounded-square ceramic / finely textured paper tile, nearly filling the canvas with a small transparent perimeter. Within the tile, a bold vermilion Japanese 日-inspired open book / stacked study-card symbol: three distinct stacked ivory page edges and one large confident red rectangular book face with a simple ivory horizontal opening. Integrate a small refined vermilion bookmark at the upper right, as part of the book, not an extra object. Strong simple geometry and slightly tactile embossed depth; restrained soft lighting and a subtle natural shadow directly beneath the tile. Palette warm ivory #f6f1e7, deep vermilion #b83b31, ink #302522 only if needed. Calm Japanese stationery aesthetic, sophisticated and highly recognizable at 32px. Front view, centered, symmetrical balance, generous internal negative space, no perspective rotation, no tiny details, no surrounding scene, no lettering other than the abstract 日 geometry, no words, no UI, no border frame, no watermark. Exactly one finished icon, not a presentation board.
```

修订：保留书页、配色、形状与内部材质，仅请求清理外部透明轮廓和移除底部阴影。使用内置工具，未调用 API CLI。

