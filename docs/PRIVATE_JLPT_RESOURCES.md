# 本机 JLPT 资料工作流

Nihongo Stack 支持把用户拥有使用依据的 JLPT 资料作为 JSON 导入本机 IndexedDB。应用会校验年份、场次、分区、连续题号、平假名、中文学习层和听力地址；缺少完整分区的资料会保留为“导入题库”，不会计入完整整卷统计。

本机公开资料放在根目录 `private-assets/`，该目录已加入 `.gitignore`。它不随代码提交，也不会被自动上传到公开仓库。

在 `apps/codex` 下运行：

```bash
npm run build:private-jlpt
npm run build:private-site-jlpt
npm run build:private-conjugaizen
```

前者转换 `HosnainRafi/jlpt-n5-resource-pack` 的 N5 题目；后者抓取 `JLPT Practice Test` 公开页面的文字词汇与阅读资料。生成的 JSON 位于 `private-assets/nihongo-stack-imports/` 或 `private-assets/nihongo-stack-site-imports/`，在应用 JLPT 页面点击“导入完整真题 JSON（可多选）”即可写入本机。

当前已抓取 2019–2024 的 N2、N3 页面。该站没有对应年份的 N4/N5 dated 页面，N5 使用前一个转换器提供的资源包。公开页面没有配套听力题，所以站点资料生成包会保持 `complete: false`，不会被误标成逐场完整试卷。

站点资料转换时会读取应用内的 OpenJLPT 离线词典，为题干和正确选项补充已知复合词的平假名及中文词义；专名或词典未收录的部分保留原文，仍可在应用内选中查询。

先运行 `npm run fetch:private-conjugaizen` 提取当前公开页面的数据快照，再运行 `npm run build:private-conjugaizen` 转换 Conjugaizen 的两套 N4 原创模拟题。题目包含四个学习分区和听力脚本，应用使用本机朗读播放；由于来源没有随题目提供可直接复用的录音 URL，生成包保持 `complete: false`。

`build:private-okjlpt` 转换 OK JLPT 的公开纸卷响应和公开 solutions 响应。当前本机已接入 N4 2021 年 12 月整卷，包含中文逐题解析、词义、听力音频和题目图片；资料只写入 `private-assets/`，不会进入公开仓库。

资料来源的题目、音频和图片仍归原权利人。当前流程面向用户个人学习；重新发布代码时不应把 `private-assets/` 内容加入提交。
