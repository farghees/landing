import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Suggestions } from '../types'

const suggestions = atom({ plugin: 'suggestion-replies', key: 'suggestions' } as const, [] as Suggestions)
const turnId = atom({ plugin: 'suggestion-replies', key: 'turnId' } as const, null as string | null)
// The final answer the suggestions belong to: they draw under its last block.
const answer = atom({ plugin: 'suggestion-replies', key: 'answer' } as const, null as string | null)

const MAX = 3
const MAX_LEN = 80

const ASK = `Suggest ${MAX} short replies the USER might send next in this conversation, written in the user's voice and language (match the language they have been using).
Each should be a natural follow-up: a next step, a clarifying question, or an approval. Max ${MAX_LEN} characters each.
Answer with exactly ${MAX} lines, one reply per line, no numbering, no quotes, nothing else.`

const parse = (text: string): Suggestions =>
  text
    .split('\n')
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^["'“]|["'”]$/g, '').trim())
    .filter(line => line.length > 0 && line.length <= MAX_LEN * 2)
    .slice(0, MAX)

const clear = async ($: EngineInterface) => {
  await update($, suggestions, () => [])
  await update($, turnId, () => null)
  await update($, answer, () => null)
}

const isLastBlockOf = (block: string, full: string | null) =>
  full !== null && block.trim() !== '' && full.trim().endsWith(block.trim())

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    await clear($)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)

    if (e.agentId !== undefined || e.reason !== 'answer' || e.answer.trim() === '') {
      return result
    }

    const id = e.turnId
    const text = e.answer
    await update($, turnId, () => id)
    await update($, answer, () => text)

    // Don't hold the turn's end on the extra completion.
    void (async () => {
      const reply = await $.model.fork({ prompt: ASK })

      if (!reply.isAnswered || (await read($, turnId)) !== id) {
        return
      }

      const picked = parse(reply.text)
      await update($, suggestions, () => picked)
    })()

    return result
  })

  // Drawn under the reply itself: AssistantMessage is raised on every surface
  // (the band above the prompt is terminal and desktop only).
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const list = await read($, suggestions)

    if (list.length === 0 || e.props.isSummary || !isLastBlockOf(e.props.text, await read($, answer))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {await next(e)}
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Text dimColor>Suggested:</Text>
          {list.map((text, i) => (
            <Button
              key={`s${i}`}
              label={text}
              onPress={async () => {
                await clear($)
                void $.prompt.submit({ text })
              }}
            />
          ))}
          <Button key="dismiss" label="✕" dimColor onPress={() => clear($)} />
        </Box>
      </Box>
    )
  })
}
