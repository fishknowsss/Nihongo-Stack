# 内容与数据模型草案 v0.1

状态：概念模型与首版最小集合；不是完整数据库迁移或最终 JSON Schema。

## 首版对象

| 对象 | 用途 | 首版关键字段 |
|---|---|---|
| `ContentSource` | 追溯内容和分发边界 | `id`, `title`, `sourceType`, `reference`, `rightsNote`, `redistributionStatus` |
| `KnowledgeItem` | 表达与解释的稳定内容 | `id`, `kind`, `expression`, `reading`, `meaning`, `sourceId`, `tags`, `revision` |
| `ReviewCard` | 一种可独立记忆与排程的提示方式 | `id`, `knowledgeId`, `mode`, `prompt`, `answer`, `sourceId` |
| `CardProgress` | 当前排程状态 | `cardId`, `schedulerVersion`, `schedulerState`, `dueAt`, `updatedAt` |
| `ReviewLog` | 不可变复习事件 | `id`, `cardId`, `reviewedAt`, `rating`, `durationMs`, `schedulerVersion` |
| `StudyTask` | 当日建议及用户操作 | `id`, `localDate`, `type`, `contentRef`, `estimatedMinutes`, `status`, `reason` |
| `ActivityLog` | 外部阅读/听力/练习也可留痕 | `id`, `kind`, `sourceRef`, `startedAt`, `durationMs`, `result`, `errorTags` |
| `ReadingPassage` | 产品内短文 | `id`, `text`, `title`, `readingLevel`, `sourceId`, `revision` |
| `ListeningClip` | 产品内真人短音频 | `id`, `audioRef`, `transcript`, `audioLicense`, `speakerCredit`, `sourceId` |
| `ComprehensionQuestion` | 阅读或听力后的简短作答 | `id`, `materialId`, `kind`, `prompt`, `options`, `answer`, `explanation` |

首版包括 `vocabulary`、`grammar`、`sentence`、少量 `ReadingPassage`、`ListeningClip` 和对应的 `ComprehensionQuestion`。大型题库、教材全文和通用媒体管理等到真实需求出现再加；不预建 19 张空表。

## 建模约束

- 内容包与个人学习记录分开。内容更新应沿用稳定 ID 和递增 `revision`；导入时避免以表达文本去重，因为同形词和多义项会冲突。
- 内容包 ID 可使用带命名空间的稳定标识，个人新建记录使用 UUID。两者均需在导入时检测冲突；不要通过重新生成 ID 掩盖同一内容的修订。
- `ReviewCard` 与 `KnowledgeItem` 是多对一；同一词可以有“字形识义”与“听音辨义”等不同卡片。不要把卡片的 `dueAt` 放在知识点上。
- `due` 是 `dueAt <= now` 的查询结果；“已掌握”之类 UI 状态由多次表现推导，不应覆盖原始日志。
- 所有事件保存稳定 ID 和发生时间；每日任务额外保存本地学习日，避免跨午夜、时区变化造成错日。时间戳使用带时区语义的标准格式。
- `redistributionStatus` 至少区分 `own_created`、`permission_confirmed`、`personal_reference_only`、`unknown`。来源不明确的内容不能被默认包含在将来公开发布的包中。官方例题亦需逐项检查版权说明。[JLPT 练习材料版权说明](https://www.jlpt.jp/e/samples/sampleindex.html)
- JSON 导入先验证格式、ID 唯一性、引用完整性和来源信息，再一次性写入。错误时不产生部分导入。导出包含 schema 版本、内容包清单与个人记录；导入覆盖前先预览并另存现有备份。

## 最小内容包示意

以下是自编示意，不代表已经完成日语教学审校。正式内容需要逐条复核。

```json
{
  "schemaVersion": 1,
  "packId": "sample-pack-001",
  "sources": [
    {
      "id": "src-original-001",
      "title": "项目自编样例",
      "sourceType": "original",
      "reference": null,
      "rightsNote": "待核对日语释义后使用",
      "redistributionStatus": "own_created"
    }
  ],
  "knowledgeItems": [
    {
      "id": "word-001",
      "kind": "vocabulary",
      "expression": "予定",
      "reading": "よてい",
      "meaning": "计划；安排",
      "sourceId": "src-original-001",
      "tags": ["daily"],
      "revision": 1
    }
  ],
  "reviewCards": [
    {
      "id": "card-word-001-recognition",
      "knowledgeId": "word-001",
      "mode": "recognition",
      "prompt": "予定",
      "answer": "よてい｜计划；安排",
      "sourceId": "src-original-001"
    }
  ]
}
```

实际开发时应把此草案转成机器可验证的 schema，并为非法引用、重复 ID、未知字段与旧版本迁移准备测试样例。

## 2026-10-07：当前运行内容包

旧 `starter-pack.v1.json` 保持原样；新增 `foundation-week.v2.json`，属于连续试用材料而非正式课程。

- `units`：稳定 `id`、顺序、目标、建议先修、六张卡的 ID、配套阅读/听音 ID、复盘提示、参考估时。
- 原创卡片/阅读/听音使用独立 v2 ID 与 `unitId`，题目有三个选项、正确项和反向核对解析。
- `sources` 记录原创文本与合成语音；`reviewStatus` 明确为 `machine_reviewed_teacher_pending`。
- `audioKind=synthetic` 明确区分新增合成语音和旧包真人录音；合成语音 source 标记 `personal_reference_only`。
- 备份仍为 schemaVersion 1，增加内容包清单与可选的作答时长、阅读辅助、音频覆盖/变速/来源证据；旧记录未有的字段不伪造为新证据。
- 草稿保留未答 `-1` 和“不知道” `-2`；已提交作答允许 `-2`，拒绝残留未答 `-1`。
- 业务、排程与本机数据库仍只在各版应用中维护，不放进共享数据层。
