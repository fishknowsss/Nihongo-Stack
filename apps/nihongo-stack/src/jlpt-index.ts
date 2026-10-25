export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2'

// Keep the small navigation index separate from the question bank. The main
// workspace only needs these counts for progress summaries; JLPTPage loads
// the full question data when the user opens that section.
export const jlptYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
export const jlptLevels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2']

// 2020 had only the December administration because the July test was cancelled.
export const jlptExamSessionsByYear: Record<number, string[]> = {
  2019: ['07', '12'],
  2020: ['12'],
  2021: ['07', '12'],
  2022: ['07', '12'],
  2023: ['07', '12'],
  2024: ['07', '12'],
  2025: ['07', '12'],
}

export const jlptPracticeSetCount = jlptYears.length * jlptLevels.length
export const jlptFullExamSlotCount = Object.values(jlptExamSessionsByYear).reduce(
  (total, sessions) => total + sessions.length * jlptLevels.length,
  0,
)
