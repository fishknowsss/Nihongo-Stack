# 本机 JLPT 资料工作流

Nihongo Stack 支持把用户拥有使用依据的 JLPT 资料作为 JSON 导入本机 IndexedDB。应用会校验年份、场次、分区、连续题号、平假名、中文学习层和听力地址；缺少完整分区的资料会保留为“导入题库”，不会计入完整整卷统计。

本机公开资料放在根目录 `private-assets/`，该目录已加入 `.gitignore`。它不随代码提交，也不会被自动上传到公开仓库。

在 `apps/codex` 下运行：

```bash
npm run build:private-jlpt
npm run build:private-site-jlpt
npm run build:private-conjugaizen
npm run build:private-eulerex
```

前者转换 `HosnainRafi/jlpt-n5-resource-pack` 的 N5 题目；后者抓取 `JLPT Practice Test` 公开页面的文字词汇与阅读资料。生成的 JSON 位于 `private-assets/nihongo-stack-imports/` 或 `private-assets/nihongo-stack-site-imports/`，在应用 JLPT 页面点击“导入本机题库/原卷资料 JSON（可多选）”即可写入本机。

当前已抓取 2019–2024 的 N2、N3 页面。该站没有对应年份的 N4/N5 dated 页面，N5 使用前一个转换器提供的资源包。公开页面没有配套听力题，所以站点资料生成包会保持 `complete: false`，不会被误标成逐场完整试卷。

站点资料转换时会读取应用内的 OpenJLPT 离线词典，为题干和正确选项补充已知复合词的平假名及中文词义；专名或词典未收录的部分保留原文，仍可在应用内选中查询。

先运行 `npm run fetch:private-conjugaizen` 提取当前公开页面的数据快照，再运行 `npm run build:private-conjugaizen` 转换 Conjugaizen 的两套 N4 原创模拟题。题目包含四个学习分区和听力脚本，应用使用本机朗读播放；由于来源没有随题目提供可直接复用的录音 URL，生成包保持 `complete: false`。

`build:private-okjlpt` 转换 OK JLPT 的公开纸卷响应和公开 solutions 响应。当前本机已接入 N4 2021 年 12 月整卷，包含中文逐题解析、词义、听力音频和题目图片；资料只写入 `private-assets/`，不会进入公开仓库。

当前另外导入了 N4 2018 年 7 月、N4 2014 年 7 月、N5 2018 年 7 月、N5 2013 年 7 月、N5 2012 年 12 月五套历史整卷。它们保留完整题目、答案、解析、图片和听力资源，但不计入近七年 `52` 场完整统计。

`build:private-site-jlpt -- --levels n4,n5 --numbered` 会抓取 JLPT Practice Test 的 20 套编号原创练习（N4 10 套、N5 10 套），作为文字词汇与阅读补充。来源页面明确说明这些编号套题不是历年真题，应用会保持“完整个人整卷”或原创练习的来源说明。

资料来源的题目、音频和图片仍归原权利人。当前流程面向用户个人学习；重新发布代码时不应把 `private-assets/` 内容加入提交。

`build:private-eulerex` 读取本机的 `private-assets/jlpt-test/normalized/`，把 2019–2023 的 N5–N2 逐场公开语料转换为“原卷语料复盘”包。它保留原卷文字分区、可用的答案组和听力原文，导入后可直接阅读、选中解释和记录笔记；由于 OCR、答案或听力覆盖不均，这类资料保持 `complete: false`，不计入 52 场完整真题统计，也不进入考试计时和得分流程。

`build:private-ayumi` 可把本机下载的 Ayumi PDF 转成同样的复盘包，并保留一条公开听力地址。当前已接入 N3 2022 年 7 月纸卷、答案线索和听力入口；它仍保持 `complete: false`，直到逐题分割、读音、中文教学和音频对应关系全部核对完成。

`build:private-ayumi-questions` 会在复盘包基础上拆出能可靠恢复的文字・語彙、文法和読解题目。当前已生成：N3 2022 年 7 月 72 道、N3 2023 年 7 月 32 道可作答题目；聴解仍保留在原卷复盘区。题目带有答案线索、中文学习步骤和来源，仍不计入完整真题统计。N3 2021 年 7 月纸卷当前为扫描版，保留原卷和答案资料，待 OCR 或逐题校验后再题目化。
