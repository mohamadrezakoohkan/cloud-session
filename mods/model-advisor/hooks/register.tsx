import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Advice } from '../types'

import { advise, oneLine, parseAdvice, report, RUBRIC } from './advise'

const advice = atom({ plugin: 'model-advisor', key: 'advice' } as const, null, {
  shape: 'advice-1',
})
const isHidden = atom(
  { plugin: 'model-advisor', key: 'isHidden' } as const,
  false,
)

// The band above the prompt is drawn on these surfaces alone; anywhere else
// (a cloud session shown in an app) the suggestion is a transcript line.
const BAND_SURFACES: readonly string[] = ['terminal', 'desktop', 'mobile']

export const register: Register = on => {
  let hasBand = false

  on('session.start', async ($, e, next) => {
    hasBand = e.surface !== null && BAND_SURFACES.includes(e.surface)
    await $.command.register({
      name: 'advise',
      description:
        'Recommend a model, effort, subagents, background subagents and workflow for a task: /advise <task>',
    })

    return next(e)
  })

  // Every typed prompt gets a free, instant recommendation in the band.
  on('prompt.submit', async ($, e, next) => {
    const isTask =
      !e.command && !e.isMeta && e.text.trim().split(/\s+/).length >= 4

    // A short follow-up ("yes", "go on") continues the task already advised.
    if (isTask) {
      const picked = advise(e.text)
      await update($, advice, () => picked)

      if (!hasBand) {
        $.ui.log(`Suggested: ${oneLine(picked)} (${picked.why})`)
      }
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  // /advise <task> asks a small model for a judgment before the task is run.
  on('command.run', { command: 'advise' }, async ($, e) => {
    const task = e.args.trim()

    if (task === '') {
      await update($, isHidden, () => false)
      const last = await read($, advice)

      return {
        text: last
          ? report(last)
          : 'Nothing to advise on yet. Try /advise <the task you have in mind>.',
      }
    }

    const reply = await $.model.complete({
      model: 'haiku',
      system: RUBRIC,
      prompt: task,
      effort: 'low',
      maxTokens: 300,
      timeoutMs: 20000,
    })
    const judged = reply.isAnswered ? parseAdvice(reply.text) : null
    const picked: Advice = judged ?? advise(task)

    await update($, advice, () => picked)
    await update($, isHidden, () => false)

    return {
      text: judged
        ? report(picked)
        : `${report(picked)}\n(The model gave no usable answer; this is the keyword estimate.)`,
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const last = await read($, advice)

    if (e.props.hasSurvey || last === null || (await read($, isHidden))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>
          Suggested: {oneLine(last)} ({last.why}){' '}
        </Text>
        <Button
          key="hide"
          label="Hide"
          onPress={() => update($, isHidden, () => true)}
        />
      </Box>
    )
  })
}
