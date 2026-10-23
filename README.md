# Nihongo Stack

这个文件夹保留两套**互不依赖的产品实现**。目前只有 Codex 版；Claude 版由后续开发者在独立目录创建。项目名称统一为 Nihongo Stack，后缀只用于区分版本和安装包。

```text
Nihongo Stack/
├── apps/
│   ├── codex/           Codex 版：前端、桌面壳、依赖、锁文件、构建产物
│   └── claude/          未来 Claude 版：由 Claude 自行创建并维护
├── shared/
│   └── content/         只共享中立的学习内容、音频及来源/许可说明
└── *.md                 项目层面的决策和评审材料
```

## 隔离约定

1. 各版本在自己的 `apps/<version>/` 内拥有独立的 `package.json`、锁文件、配置、源代码、桌面壳、构建目录和本地数据库名；不要从另一个版本的 `src/` 导入代码。
2. 两版可以读取 `shared/content/` 的**版本化数据文件**，但不在其中放 UI、业务逻辑、持久化代码或某一版专用配置。改变旧包的字段、ID 或题目语义时创建新版本，避免另一版被动改变。
3. 各版的 macOS bundle identifier、应用显示名、网站部署目标和数据存储名称须不同。Codex 版使用 `com.nihongostack.codex` 和 IndexedDB `nihongo-stack-codex`；Claude 版另取唯一值。这样两款应用可并存，互不覆盖进度。
4. 发布、同步或数据迁移是各版分别决定的产品工作。共享内容不等于共享学习记录；未来如要迁移进度，应通过明确的数据导出/导入格式，并由用户选择执行。

## 当前可试用版本

见 [Codex 版使用说明](apps/codex/README.md)。首版面向私人本机试用；网站尚未发布，Mac 与 iPhone 的自动同步尚未实现。

项目决策见 [DECISIONS.md](DECISIONS.md)，内容许可见 [shared/content/README.md](shared/content/README.md)。
