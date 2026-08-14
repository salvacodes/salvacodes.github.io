import { mostRecentFirst, occupationsMostRecentFirst } from '../resume/career-chronology'
import { formatPeriod } from '../resume/period'
import { resumeContent } from '../resume/resume-content'
import type { Tenure } from '../resume/resume-model'

const tenureBlock = (tenure: Tenure): string[] => [
  `${tenure.org} (${formatPeriod(tenure.period)})`,
  ...occupationsMostRecentFirst(tenure.occupations).map(
    (occupation) => `  ${occupation.title} — ${formatPeriod(occupation.period)}`
  ),
  ''
]

const tenureLines = (): string[] =>
  mostRecentFirst(resumeContent.tenures, [], { renderTenure: tenureBlock, renderGap: () => [] }).flat()

const resumeFile = [
  `${resumeContent.profile.name} — Resume++`,
  '='.repeat(`${resumeContent.profile.name} — Resume++`.length),
  resumeContent.profile.headline,
  '',
  ...tenureLines(),
  'Type `resume` to open the full Resume++, or launch it from the dock.'
].join('\n')

export const homeDirectory: Record<string, string> = {
  'about.txt': `Hi, I'm Salva.
Fifteen years building software; these days I lead the engineering
sub-team inside Cyber Defense at Thoughtworks.
Off the clock: metal, games, and a few unpopular opinions.
This site is my desktop — poke around.`,
  'resume.txt': resumeFile,
  '/etc/motd': `Welcome to salva.codes — a zero-dependency desktop in your browser.
Open apps from the dock below or the Activities overview.`
}
