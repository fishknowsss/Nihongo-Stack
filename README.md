# Nihongo Stack

这是 Nihongo Stack 的单一实现：一个由 Codex 持续维护的本机优先日语学习应用。项目不再按开发者或模型拆分目录，也不保留第二套产品实现。

```text
Nihongo Stack/
├── apps/
│   └── nihongo-stack/   前端、桌面壳、依赖、锁文件和构建入口
├── shared/
│   └── content/         中立的学习内容、音频及来源/许可说明
└── *.md                 项目层面的决策和评审材料
```

## 当前版本

应用名为 `Nihongo Stack`，桌面包为 `Nihongo Stack.app`，bundle identifier 为 `com.nihongostack.desktop`。当前桌面壳为 MyGo，本机学习记录仍使用旧的 IndexedDB 名 `nihongo-stack-codex`，用于保留数据结构与备份兼容；MyGo 使用 `mygo://localhost/` 页面来源，已有 Tauri 页面来源中的记录首次使用时应通过 JSON 备份导入。

见 [Nihongo Stack 使用说明](apps/nihongo-stack/README.md)。首版面向私人本机试用；网站尚未发布，Mac 与 iPhone 的自动同步尚未实现。

项目决策见 [DECISIONS.md](DECISIONS.md)，内容许可见 [shared/content/README.md](shared/content/README.md)。
