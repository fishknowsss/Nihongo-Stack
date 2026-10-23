import type { Attempt, Preference, ReviewEvent } from './db'
import { formatStudyTime } from './activityModel'
import { weeklyReport } from './weeklyModel'

export default function WeeklyReport({ preferences, attempts, events, now }: {
  preferences: Preference[]; attempts: Attempt[]; events: ReviewEvent[]; now: number
}) {
  const report = weeklyReport(preferences, attempts, events, now)
  const total = report.byKind.reduce((sum, item) => sum + item.activeMs, 0)
  const reasons = Object.entries(report.reasons).sort((a, b) => b[1] - a[1])
  const dateLabel = (day: string) => day.slice(5).replace('-', '/')
  return <section className="weekly-report" aria-labelledby="weekly-report-title">
    <div className="section-heading"><h2 id="weekly-report-title">一周学习回顾</h2><span className="field-hint">{dateLabel(report.rows[0].day)}—{dateLabel(report.rows[6].day)} · 截至昨天</span></div>
    <p>七个完整自然日中，{report.activeDays} 天记有活跃时间，合计 {formatStudyTime(total)}。<span className="report-today">今天已记录 {formatStudyTime(report.todayMs)}，将在明天纳入回顾。</span></p>
    <dl className="report-kinds">{report.byKind.map(item => <div key={item.view}><dt>{item.label}</dt><dd>{formatStudyTime(item.activeMs)}</dd></div>)}</dl>
    <details className="report-detail"><summary>查看每天的时间与练习量</summary><div className="report-table-wrap"><table><caption>前台活跃时间与实际提交分别统计</caption><thead><tr><th scope="col">日期</th><th scope="col">活跃时间</th><th scope="col">卡片反馈</th><th scope="col">阅读 / 听音提交</th></tr></thead><tbody>{report.rows.map(row => <tr key={row.day}><th scope="row">{dateLabel(row.day)}</th><td>{formatStudyTime(row.activeMs)}</td><td>{row.reviews} 次</td><td>{row.exercises} 次</td></tr>)}</tbody></table></div></details>
    <div className="report-observation"><h3>下周怎么安排</h3>
      {report.activeDays < 7 ? <p>先积累七天真实使用，目前记有 {report.activeDays} / 7 天。可以分次学习，在今日按当天空闲调整时间。</p> : <p>七天都有活跃时间记录，可以结合每天的练习量与任务调整原因，手动安排下周的学习时间。</p>}
      {reasons.length > 0 ? <p>这周的任务调整原因：{reasons.map(([reason, count]) => `${reason} ${count} 次`).join('；')}。可以据此减少当天任务，或把阅读与听音分开完成。</p> : <p>遇到时间不够或材料困难时，在今日选择跳过或明天再做，并记录原因，下次回顾会显示在这里。</p>}
    </div>
    <p className="field-hint">活跃时间以分:秒显示；后台、失焦、暂停及 60 秒无操作后的时间不计，长时间静读可能少计。旧版经过时间单独保留，计划估时由你手动调整。</p>
  </section>
}
