import { expect, test } from 'claude-code/testing'

const REPLY = {
  plugin: 'suggestion-replies',
  component: 'AssistantMessage',
  requestId: 'm1',
  props: { text: 'Done.', isFirstOfReply: true },
} as const

const engineDraws = (on: Parameters<Parameters<typeof test>[1]>[1]) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

for (const surface of ['terminal', 'desktop', 'mobile', 'vscode'] as const) {
  test(`an answer brings suggestions under it on ${surface}; pressing one submits it`, async ($, on) => {
    const sent: string[] = []
    engineDraws(on)
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

    const ui = await $.ui.mount({ ...REPLY, surface })
    expect(await ui.find({ type: 'Text', text: /engine/ })).toBeDefined()
    expect((await ui.find({ key: 's0' }))?.text).toContain('Yes, do it')
    expect((await ui.find({ key: 's2' }))?.text).toContain('Explain more')
    await ui.press({ key: 's1' })
    await new Promise(r => setTimeout(r, 50))
    expect(sent).toEqual(['Show me the diff'])
    expect(await ui.find({ key: 's0' })).toBeUndefined()
    await ui.unmount()
  })
}

test('an older reply gets no suggestions', async ($, on) => {
  engineDraws(on)
  on('turn.complete', () => ({ text: '' }))
  on('model.fork', () => ({ value: { isAnswered: true, text: 'a\nb\nc', usage: {} } as never }))

  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'Latest.', durationMs: 1, isAborted: false } as never)
  await new Promise(r => setTimeout(r, 50))

  const ui = await $.ui.mount({ ...REPLY, surface: 'mobile' })
  expect(await ui.find({ key: 's0' })).toBeUndefined()
  await ui.unmount()
})
