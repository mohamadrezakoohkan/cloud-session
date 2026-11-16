import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'model-advisor',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 200,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
  surface: 'terminal',
} as const

const typed = (text: string) =>
  ({ text, wait: false, origin: { kind: 'composer' } }) as const

test('a typed prompt puts its recommendation in the band', async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))

  await $.prompt.submit(
    typed(
      'Refactor the auth module across every service and debug the race condition in token refresh',
    ),
  )
  const ui = await $.ui.mount(BAND)
  const row = await ui.find({ type: 'Text', text: /Suggested/ })

  expect(row?.text).toMatch(
    /opus · high effort · subagents yes · background no · workflow yes/,
  )
  await ui.unmount()
})

test('a small ask gets the small model', async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))

  await $.prompt.submit(typed('fix the typo in the README title'))
  const ui = await $.ui.mount(BAND)
  const row = await ui.find({ type: 'Text', text: /Suggested/ })

  expect(row?.text).toMatch(/haiku · low effort · subagents no/)
  await ui.unmount()
})

test('/advise falls back to the keyword estimate when the model is silent', async ($, on) => {
  on('model.complete', () => ({
    value: {
      isAnswered: false,
      reason: 'empty-reply',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  }))

  const ran = await $.command.run({
    command: 'advise',
    args: 'run the full test suite in the background while I add a settings screen',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })

  expect(ran.text).toMatch(/Background subagents: yes/)
  expect(ran.text).toMatch(/keyword estimate/)
})

test('where no band is drawn the suggestion is a transcript line', async ($, on) => {
  const lines: string[] = []
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'advise' } }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('ui.log', (_, e) => {
    lines.push(e.text)

    return { value: undefined }
  })

  await $.session.start({ cwd: '/', surface: null, isInteractive: false })
  await $.prompt.submit(typed('fix the typo in the README title'))

  expect(lines.join('\n')).toMatch(/Suggested: haiku · low effort/)
})
