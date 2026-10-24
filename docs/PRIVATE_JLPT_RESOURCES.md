# 本机 JLPT 资料工作流

Nihongo Stack 支持把用户拥有使用依据的 JLPT 资料作为 JSON 导入本机 IndexedDB。应用会校验年份、场次、分区、连续题号、平假名、中文学习层和听力地址；缺少完整分区的资料会保留为“导入题库”，不会计入完整整卷统计。

本机公开资料放在根目录 `private-assets/`，该目录已加入 `.gitignore`。它不随代码提交，也不会被自动上传到公开仓库。

在 `apps/codex` 下运行：

```bash
npm run build:private-jlpt
npm run build:private-site-jlpt
```

前者转换 `HosnainRafi/jlpt-n5-resource-pack` 的 N5 题目；后者抓取 `JLPT Practice Test` 公开页面的文字词汇与阅读资料。生成的 JSON 位于 `private-assets/nihongo-stack-imports/` 或 `private-assets/nihongo-stack-site-imports/`，在应用 JLPT 页面点击“导入完整真题 JSON（可多选）”即可写入本机。

资料来源的题目、音频和图片仍归原权利人。当前流程面向用户个人学习；重新发布代码时不应把 `private-assets/` 内容加入提交。
