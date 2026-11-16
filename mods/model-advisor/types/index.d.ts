export type AdvisedModel = 'haiku' | 'sonnet' | 'opus' | 'fable'
export type AdvisedEffort = 'low' | 'medium' | 'high' | 'xhigh'

export type Advice = {
  model: AdvisedModel
  effort: AdvisedEffort
  /** Hand independent reading or searching to subagents. */
  subagents: boolean
  /** Run a long side job (tests, a build, a watch) in a background subagent. */
  background: boolean
  /** Orchestrate many agents with a dynamic workflow. */
  workflow: boolean
  why: string
}

declare module 'claude-code' {
  interface PluginState {
    'model-advisor': { advice: Shaped<Advice | null>; isHidden: boolean }
  }
}
