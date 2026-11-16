import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Handoff } from '../types'

type Draft = Pick<Handoff, 'text' | 'command' | 'note'>

const PANE = 'handoffs'
const DAY = 86_400_000
const MARKER = /^(?:[-*]|\d+\.)\s+/

// Only redraws the readers: the ledger is read from the store at each draw, because
// a desktop session starts in a spare folder and gets its real cwd afterwards.
const tick = atom({ plugin: 'handoff-ledger', key: 'tick' } as const, 0, { shape: 'tick-1' })

const parse = (answer: string, heading: string): Draft[] => {
  const lines = answer.split('\n')
  const start = lines.map(l => l.trim()).lastIndexOf(heading)
  if (start === -1) return []

  const found: Draft[] = []
  let fence: { indent: number; lines: string[] } | undefined
  let listed = false
  for (const raw of lines.slice(start + 1)) {
    const line = raw.trim()
    if (line.startsWith('```')) {
      if (fence === undefined) {
        fence = { indent: raw.indexOf('`'), lines: [] }
        continue
      }
      const command = fence.lines.join('\n')
      fence = undefined
      const last = found.at(-1)
      if (last !== undefined && last.command === undefined) last.command = command
      else found.push({ text: '', command })
      continue
    }
    if (fence !== undefined) {
      const { indent } = fence
      fence.lines.push(raw.slice(0, indent).trim() === '' ? raw.slice(indent) : line)
      continue
    }
    if (line === '') continue
    const text = line.replace(MARKER, '')
    const marked = text !== line
    listed ||= marked
    const last = found.at(-1)
    if (last !== undefined && last.text === '') last.text = text
    // In a bulleted block an unmarked line is the item's why, not a new item.
    else if (listed && !marked && last !== undefined) last.note = last.note === undefined ? text : `${last.note} ${text}`
    else found.push({ text })
  }
  return found
}

const key = async ($: EngineInterface) => `open:${await $.session.cwd()}`

const load = async ($: EngineInterface): Promise<Handoff[]> => {
  const stored = await $.store.get(await key($))
  return Array.isArray(stored) ? (stored as Handoff[]) : []
}

const change = async ($: EngineInterface, fn: (list: Handoff[]) => Handoff[]) => {
  const list = fn(await load($))
  await $.store.set(await key($), list)
  await update($, tick, n => n + 1)
}

export const register: Register = (on, options) => {
  const heading = (options.heading as string).trim()
  const title = heading.replace(/^[#*_\s]+|[*_\s]+$/g, '')

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'handoffs', description: 'Open the hand-off ledger pane' })
    return next(e)
  })

  on('command.run', { command: 'handoffs' }, async $ => {
    await $.ui.open({ id: PANE, title })
    return { text: 'Hand-off ledger opened.' }
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId !== undefined) return r
    const found = parse(e.answer, heading)
    if (found.length === 0) return r
    const at = await $.clock.now()
    await change($, list => [
      ...list,
      ...found
        .filter(f => !list.some(o => o.text === f.text && o.command === f.command))
        .map((f, i) => ({ ...f, id: `${at}-${i}`, at })),
    ])
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    await read($, tick)
    const list = await load($)
    if (e.props.hasSurvey || list.length === 0) return below

    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {below}
        <Box>
          <Button
            key="handoffs"
            plain
            label={`✋ ${title} ${list.length}`}
            onPress={() => {
              void $.ui.open({ id: PANE, title })
            }}
          />
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    await read($, tick)
    const list = await load($)
    const now = await $.clock.now()

    return (
      <Box flexDirection="column" gap={1}>
        {list.length === 0 && <Text dimColor>Nothing owed.</Text>}
        {list.map(item => {
          const days = Math.floor((now - item.at) / DAY)
          const { command, note } = item
          return (
            <Box flexDirection="column">
              <Text>
                {item.text}
                {days >= 1 && <Text dimColor> ({days}d ago)</Text>}
              </Text>
              {note !== undefined && <Text dimColor>{note}</Text>}
              {command !== undefined && <Text dimColor>{command}</Text>}
              <Box flexDirection="row" gap={1}>
                {command !== undefined && (
                  <Button
                    key={`copy-${item.id}`}
                    label="Copy command"
                    onPress={press => {
                      void $.ui.copy({ text: command, surface: press.surface })
                    }}
                  />
                )}
                <Button
                  key={`done-${item.id}`}
                  label="Done"
                  onPress={() => {
                    void change($, l => l.filter(o => o.id !== item.id))
                  }}
                />
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
