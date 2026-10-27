# Nihongo Stack v1.0 图标

内置 `image_gen` 生成，2026-10-27。米白圆角底板、朱红叠放书页、抽象「あ」和书签。桌面和侧栏保持同一图形；MyGo 使用清理外部白色包边后的 `assets/app-icon-v1.0.png` 生成 macOS `AppIcon.icns`。

- 原稿：`app-icon-v0.3.png`
- 侧栏：`../public/app-icon-128.png`
- favicon：`../public/favicon-32.png`
- 桌面：`app-icon-v1.0.png`，由 `mygo.config.ts` 作为 MyGo 应用图标使用；它保留书本、书签和「あ」，外部为透明背景。
- 旧 v0.2 图标随旧程序保存在项目 `output/product-improvement/2026-10-08/before/`。

生成提示词：

```text
Use case: logo-brand.
Asset type: finished macOS application icon for Nihongo Stack, a private Japanese study app.
Create one square premium macOS icon, isolated on actual transparent background. A warm ivory softly rounded-square ceramic / finely textured paper tile, nearly filling the canvas with a small transparent perimeter. Within the tile, a bold vermilion Japanese あ-inspired open book / stacked study-card symbol: three distinct stacked ivory page edges and one large confident red rectangular book face with a simple ivory horizontal opening. Integrate a small refined vermilion bookmark at the upper right, as part of the book, not an extra object. Strong simple geometry and slightly tactile embossed depth; restrained soft lighting and a subtle natural shadow directly beneath the tile. Palette warm ivory #f6f1e7, deep vermilion #b83b31, ink #302522 only if needed. Calm Japanese stationery aesthetic, sophisticated and highly recognizable at 32px. Front view, centered, symmetrical balance, generous internal negative space, no perspective rotation, no tiny details, no surrounding scene, no lettering other than the abstract あ geometry, no words, no UI, no border frame, no watermark. Exactly one finished icon, not a presentation board.
```

修订：保留书页、配色、形状与内部材质，仅请求清理外部透明轮廓和移除底部阴影。使用内置工具，未调用 API CLI。

