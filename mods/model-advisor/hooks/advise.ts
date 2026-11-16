import type { Advice, AdvisedEffort, AdvisedModel } from '../types'

const MODELS: readonly AdvisedModel[] = ['haiku', 'sonnet', 'opus', 'fable']
const EFFORTS: readonly AdvisedEffort[] = ['low', 'medium', 'high', 'xhigh']

// Each signal moves the difficulty score; the score picks the model and effort.
const TRIVIAL =
  /\b(typo|rename|reformat|format|lint|bump|what is|what does|where is|show me|list|explain this line|one[- ]liner|quick|simple|small)\b/i
const HARD =
  /\b(architect\w*|design|refactor\w*|migrat\w*|debug\w*|root cause|race condition|deadlock|concurren\w*|performance|optimi[sz]\w*|security|vulnerab\w*|memory leak|flaky|intermittent|trade-?offs?|strategy|rewrite)\b/i
const HARDEST =
  /\b(from scratch|novel|research|prove|proof|algorithm|compiler|distributed|end[- ]to[- ]end|whole (system|codebase|app)|entire (system|codebase|app)|no idea why|nobody knows)\b/i

const BROAD =
  /\b(across|throughout|every|each|all (the )?(files|modules|services|packages|repos|usages|call sites)|codebase|find all|audit|explore|investigate|survey|compare|multiple (files|modules|services|repos))\b/i
const BACKGROUND =
  /\b(while|meanwhile|in the meantime|in the background|in parallel|keep (running|watching)|monitor|watch|long[- ]running|run (the )?(full )?(tests?|test suite|build|ci|benchmarks?))\b/i
const FAN_OUT =
  /\b(every (file|module|service|package|repo|endpoint|screen|component)|each (file|module|service|package|repo|endpoint|screen|component)|all (the )?(files|modules|services|packages|repos|endpoints|screens|components)|hundreds|dozens|bulk|mass|workflow|orchestrat\w*|fan[- ]?out)\b/i

export const isModel = (v: unknown): v is AdvisedModel =>
  MODELS.includes(v as AdvisedModel)
export const isEffort = (v: unknown): v is AdvisedEffort =>
  EFFORTS.includes(v as AdvisedEffort)

/** A free, instant recommendation read off the prompt's wording and size. */
export const advise = (text: string): Advice => {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const reasons: string[] = []
  let score = 1

  if (words > 150) {
    score += 1
    reasons.push('long brief')
  }
  if (TRIVIAL.test(text) && words < 40) {
    score -= 1
    reasons.push('small, well-defined ask')
  }
  if (HARD.test(text)) {
    score += 1
    reasons.push('needs design or diagnosis')
  }
  if (HARDEST.test(text)) {
    score += 2
    reasons.push('open-ended or system-wide')
  }

  const workflow = FAN_OUT.test(text) && (HARD.test(text) || words > 25)
  const subagents = workflow || BROAD.test(text)
  const background = BACKGROUND.test(text)

  // Fan-out is breadth, not depth: it never raises the model on its own.
  if (workflow) {
    reasons.push('same work repeated over many targets')
  } else if (subagents) {
    reasons.push('broad reading that splits into independent parts')
  }
  if (background) {
    reasons.push('a long-running side job')
  }

  const level = Math.max(0, Math.min(3, score))

  return {
    model: MODELS[level]!,
    effort: EFFORTS[level]!,
    subagents,
    background,
    workflow,
    why: reasons.join('; ') || 'ordinary single-area task',
  }
}

export const RUBRIC = `You route coding-agent tasks. Reply with one JSON object and nothing else:
{"model":"haiku|sonnet|opus|fable","effort":"low|medium|high|xhigh","subagents":bool,"background":bool,"workflow":bool,"why":"under 20 words"}

model: haiku = lookups, renames, mechanical edits. sonnet = ordinary features, bug fixes, tests in one area. opus = multi-file design, hard debugging, refactors, security or performance work. fable = the hardest, most open-ended or system-wide problems.
effort: low = obvious answer. medium = routine. high = real trade-offs or subtle bugs. xhigh = only when a wrong answer is costly and the problem is deep.
subagents: true when the task needs broad reading or searching that splits into independent parts.
background: true when a long side job (test suite, build, watch, monitor) should run while other work continues.
workflow: true only for large fan-out, the same work over many files, modules or repos; it spends many tokens.
Prefer the cheapest choice that will do the task well.`

/** Reads the model's JSON reply; null when it is not a whole recommendation. */
export const parseAdvice = (reply: string): Advice | null => {
  const found = reply.match(/\{[\s\S]*\}/)

  if (!found) {
    return null
  }

  try {
    const v = JSON.parse(found[0]) as Record<string, unknown>

    if (!isModel(v.model) || !isEffort(v.effort)) {
      return null
    }

    return {
      model: v.model,
      effort: v.effort,
      subagents: v.subagents === true || v.workflow === true,
      background: v.background === true,
      workflow: v.workflow === true,
      why: typeof v.why === 'string' ? v.why.slice(0, 200) : '',
    }
  } catch {
    return null
  }
}

const mark = (on: boolean) => (on ? 'yes' : 'no')

export const oneLine = (a: Advice) =>
  `${a.model} · ${a.effort} effort · subagents ${mark(a.subagents)} · background ${mark(a.background)} · workflow ${mark(a.workflow)}`

export const report = (a: Advice) =>
  [
    `Model: ${a.model}  (/model ${a.model})`,
    `Effort: ${a.effort}  (/effort ${a.effort})`,
    `Subagents: ${mark(a.subagents)}`,
    `Background subagents: ${mark(a.background)}`,
    `Dynamic workflow: ${mark(a.workflow)}${a.workflow ? '  (say "use a workflow" in the prompt)' : ''}`,
    `Why: ${a.why}`,
  ].join('\n')
