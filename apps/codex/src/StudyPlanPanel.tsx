import { ArrowRight, BookOpen, GraduationCap } from '@phosphor-icons/react'
import type { StudyPlan } from './studyPlan'

export default function StudyPlanPanel({ plan, onFoundation, onJlpt }: {
  plan: StudyPlan
  onFoundation: () => void
  onJlpt: () => void
}) {
  const urgencyLabel = plan.urgency === 'critical' ? '冲刺阶段' : plan.urgency === 'tight' ? '紧凑阶段' : '稳步阶段'
  return (
    <section className="study-plan-panel" aria-labelledby="study-plan-title">
      <div className="study-plan-heading">
        <div>
          <span className="study-plan-kicker">双轨学习计划 · {urgencyLabel}</span>
          <h2 id="study-plan-title">基础理解和 N2 冲刺并行</h2>
        </div>
        <div className="study-plan-deadline">
          <strong>{plan.daysRemaining}</strong>
          <span>天至 {plan.examDate.replaceAll('-', '.')}</span>
        </div>
      </div>
      <p className="study-plan-rationale">{plan.rationale}</p>
      <div className="study-plan-tracks">
        <article className="study-plan-track foundation">
          <div className="study-plan-track-title"><BookOpen size={18} /><strong>初学理解</strong><span>{plan.foundationMinutes} 分钟</span></div>
          <p>{plan.foundationTarget}</p>
          <button className="text-button" onClick={onFoundation}>进入基础学习 <ArrowRight size={15} /></button>
        </article>
        <article className="study-plan-track jlpt">
          <div className="study-plan-track-title"><GraduationCap size={18} /><strong>N2 高速推进</strong><span>{plan.jlptMinutes} 分钟</span></div>
          <p>{plan.jlptTarget}</p>
          <button className="text-button" onClick={onJlpt}>进入 JLPT 工作台 <ArrowRight size={15} /></button>
        </article>
      </div>
      <p className="study-plan-footnote">今日建议：基础 {plan.foundationCount} 个小步，JLPT {plan.jlptQuestionCount} 题；完成后优先回收错题。</p>
    </section>
  )
}
