# Nihongo Stack 共享学习内容

这里仅放与产品实现无关的学习数据和媒体。Nihongo Stack 从 `apps/nihongo-stack/` 读取并呈现；这里不放 React 组件、数据库访问、业务状态或构建配置。

`starter-pack.v1.json` 是首日试用包：词汇、基础语法、两篇项目自编短文及理解题、三段短句听力。文件名和内部 `schemaVersion` 均固定为 v1；后续需要改字段、删除 ID 或改变题目语义时，新建 v2 包并让各版本应用各自决定何时升级。不要在这里放任一产品版本的数据库结构或组件。

自编内容已做基本语言检查，但尚未经过专业日语教师审校，不作为正式 JLPT 题目或分数校准。

三段听力的文本来自 [Tatoeba](https://tatoeba.org/en/downloads)，按各句页面标注为 CC BY 2.0 FR；对应录音由 yomi 或 Mizu 贡献，逐条页面标注为 CC BY-NC 4.0。具体句子、录音文件、署名和来源 URL 见 `starter-pack.v1.json` 的 `listenings`。使用时须显示来源；不得将录音用于商业发布。

未来上线网站前，必须重新审核本目录的每一项内容及媒体许可；个人使用阶段的资料不能自动视为公开分发授权。

## foundation-week.v2.json · 2026-10-07

新增独立 v2 内容包，不改写 v1。七个基础单元各自包含六张卡、一篇短文、三道阅读题、一段听音练习、两道听音题及复盘目标；按日常情境和可观察的理解任务组织。方法参考日本国际交流基金 [Can-do 组织方式](https://www.irodori.jpf.go.jp/en/about.html)，没有复制教材原文或音频。

文本、选择题和解析为本项目原创，`reviewStatus=machine_reviewed_teacher_pending`。本轮只完成结构、题文对应和基础语言复核，尚未取得母语者/专业教师审校记录。

新音频为本机 `say -v Kyoko` 生成，再转为 MP3；在产品内明确标记“合成语音”。源记录 `ns-speech-v2` 标记 `personal_reference_only`，只用于私人练习，公开再分发权限尚未核验。不能把它们称为真人录音或真实听力能力验证。生成脚本位于 `apps/nihongo-stack/scripts/generate-practice-audio.mjs`，仅补缺失文件。

专业语言审校、相应真人录音、录音许可与一周真实使用后的估时校准仍待完成。试用资料可用于连续练习，不能据此宣称正式课程或 N2 测评。
