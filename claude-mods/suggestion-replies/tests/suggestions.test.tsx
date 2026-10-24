import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'suggestion-replies',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

test('an answer brings suggestions; pressing one submits it', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const sent: string[] = []
  on('turn.complete', () => ({ text: '' }))
  on('model.fork', () => ({
    value: { isAnswered: true, text: '1. Yes, do it\n- Show me the diff\n"Explain more"', usage: {} } as never,
  }))
  on('prompt.submit', (_, e) => {
    sent.push(e.text)
    return { text: e.text }
  })

  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'Done.', durationMs: 1, isAborted: false } as never)
  await new Promise(r => setTimeout(r, 50))

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ key: 's0' }))?.text).toContain('Yes, do it')
  expect((await ui.find({ key: 's2' }))?.text).toContain('Explain more')
  await ui.press({ key: 's1' })
  await new Promise(r => setTimeout(r, 50))
  expect(sent).toEqual(['Show me the diff'])
  expect(await ui.find({ key: 's0' })).toBeUndefined()
  await ui.unmount()
})

test('nothing shows while a turn is working', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('state.get', () => ({ value: { value: ['hi'], version: 1 } }))
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true }, surface: 'terminal' })
  expect(await ui.find({ key: 's0' })).toBeUndefined()
  await ui.unmount()
})
