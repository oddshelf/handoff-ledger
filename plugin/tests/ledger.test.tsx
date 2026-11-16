import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'handoff-ledger',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 3,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 3 },
    view: {},
  },
} as const

const PANE = {
  plugin: 'handoff-ledger',
  component: 'Pane',
  requestId: 'handoffs',
  props: {
    title: '等你動手',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const DAY = 86_400_000

const engine = (on: On, entries: Record<string, unknown> = {}, now = 0, cwd = () => '/repo') => {
  mock.store(on, entries)
  mock.clock(on, { now })
  on('session.cwd', () => ({ value: cwd() }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'handoffs' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('ui.render', ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    return Box({ children: Text({ children: 'beneath' }) })
  })
}

const shown = async (pane: { findAll: (query: object) => Promise<readonly { type: string; text: string }[]> }) =>
  (await pane.findAll({})).filter(e => e.type === 'Text' || e.type === 'Markdown').map(e => e.text)

const turn = (answer: string, agentId?: string) =>
  ({ answer, durationMs: 0, isAborted: false, turnId: 't', reason: 'answer', ...(agentId ? { agentId } : {}) }) as const

const REPLY = [
  'Done. Two things are yours.',
  '',
  '**等你動手**',
  '- 推上 main（dcg 擋我）',
  '  ```bash',
  '  git push origin main',
  '  ```',
  '```bash',
  'rm -r ~/.claude/mods/old',
  '```',
  '刪掉舊 mod',
  '- 重開 session',
].join('\n')

test('a reply’s hand-off block lands in the band count and the pane', async ($, on) => {
  engine(on)
  await $.turn.complete(turn(REPLY))

  for (const surface of ['terminal', 'desktop'] as const) {
    const band = await $.ui.mount({ ...BAND, surface })
    expect((await band.find({ key: 'handoffs' }))?.props.label).toBe('✋ 等你動手 3')
    expect(await band.find({ type: 'Text', text: /^beneath$/ })).toBeDefined()
    await band.unmount()

    const pane = await $.ui.mount({ ...PANE, surface })
    const texts = await shown(pane)
    expect(texts).toEqual([
      '推上 main（dcg 擋我）',
      'git push origin main',
      '刪掉舊 mod',
      'rm -r ~/.claude/mods/old',
      '重開 session',
    ])
    expect(await pane.findAll({ type: 'Button', text: /^Copy command$/ })).toHaveLength(2)
    await pane.unmount()
  }
})

test('the button sits on one line with what is beneath', async ($, on) => {
  engine(on)
  await $.turn.complete(turn(REPLY))

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const directions = (await band.findAll({ type: 'Box' })).map(b => b.props.flexDirection)
  expect(directions).toContain('row')
  await band.unmount()
})

test('nothing is kept from a reply without the block, or from a subagent’s', async ($, on) => {
  engine(on)
  await $.turn.complete(turn('All done, nothing owed.'))
  await $.turn.complete(turn(REPLY, 'agent-1'))

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await band.find({ key: 'handoffs' })).toBeUndefined()
  expect(await band.find({ type: 'Text', text: /^beneath$/ })).toBeDefined()
  await band.unmount()
})

test('the same item owed twice is kept once', async ($, on) => {
  engine(on)
  await $.turn.complete(turn(REPLY))
  await $.turn.complete(turn('**等你動手**\n重開 session\n跑 agent-sync push'))

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await band.find({ key: 'handoffs' }))?.props.label).toBe('✋ 等你動手 4')
  await band.unmount()
})

test('an item reworded around the same command is kept once; a reworded item without one is a new item', async ($, on) => {
  engine(on)
  await $.turn.complete(turn('**等你動手**\n- 重新登入\n  ```bash\n  claude /login\n  ```\n- 上傳預覽圖'))
  await $.turn.complete(turn('**等你動手**\n- 選做，CLI 重登\n  ```bash\n  claude /login\n  ```\n- 上傳預覽圖（合併後）'))

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await shown(pane)).toEqual([
    '重新登入',
    'claude /login',
    '上傳預覽圖',
    '上傳預覽圖（合併後）',
  ])
  await pane.unmount()
})

test('a new session reads this repo’s ledger, with each item’s age, and Done removes it for good', async ($, on) => {
  const stored = {
    'open:/repo': [
      { id: 'a', at: 0, text: 'old one' },
      { id: 'b', at: 3 * DAY, text: 'fresh one' },
    ],
    'open:/elsewhere': [{ id: 'c', at: 0, text: 'not ours' }],
  }
  engine(on, stored, 3 * DAY + 1000)
  await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true })

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await shown(pane)).toEqual(['old one', '3d ago', 'fresh one'])
  await pane.press({ key: 'done-a' })
  expect(await shown(pane)).toEqual(['fresh one'])
  await pane.unmount()

  await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await band.find({ key: 'handoffs' }))?.props.label).toBe('✋ 等你動手 1')
  await band.unmount()
})

test('Clear all asks once, Keep backs out, and the second press empties this repo’s ledger only', async ($, on) => {
  const stored = {
    'open:/repo': [
      { id: 'a', at: 0, text: 'one' },
      { id: 'b', at: 0, text: 'two' },
    ],
    'open:/elsewhere': [{ id: 'c', at: 0, text: 'not ours' }],
  }
  let cwd = '/repo'
  engine(on, stored, 0, () => cwd)

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await pane.find({ key: 'clear' }))?.props.label).toBe('Clear all')
  expect(await pane.find({ key: 'keep' })).toBeUndefined()

  await pane.press({ key: 'clear' })
  expect((await pane.find({ key: 'clear' }))?.props.label).toBe('Clear all 2?')
  expect(await shown(pane)).toEqual(['one', 'two'])

  await pane.press({ key: 'keep' })
  expect((await pane.find({ key: 'clear' }))?.props.label).toBe('Clear all')

  await pane.press({ key: 'clear' })
  await pane.press({ key: 'done-a' })
  expect((await pane.find({ key: 'clear' }))?.props.label).toBe('Clear all')
  expect(await shown(pane)).toEqual(['two'])

  await pane.press({ key: 'clear' })
  await pane.press({ key: 'clear' })
  expect(await shown(pane)).toEqual(['Nothing owed.'])
  expect(await pane.find({ key: 'clear' })).toBeUndefined()
  await pane.unmount()

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await band.find({ key: 'handoffs' })).toBeUndefined()
  await band.unmount()

  cwd = '/elsewhere'
  const other = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await other.find({ key: 'handoffs' }))?.props.label).toBe('✋ 等你動手 1')
  await other.unmount()
})

test('an item’s text and reason are drawn as markdown, its command as written', async ($, on) => {
  engine(on, { 'open:/repo': [{ id: 'a', at: 0, text: '按 `Done`', note: '見 `README`', command: 'echo `date`' }] }, 2 * DAY)

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await pane.findAll({ type: 'Markdown' })).map(m => m.text)).toEqual(['按 `Done`', '見 `README`'])
  expect((await pane.findAll({ type: 'Text' })).map(t => t.text)).toEqual(['2d ago', 'echo `date`'])
  await pane.unmount()
})

test('in a bulleted block an unmarked line is the why of the item above it', async ($, on) => {
  engine(on)
  await $.turn.complete(
    turn(
      [
        '**等你動手**',
        '- 重開 app',
        '  ```bash',
        '  open -a Claude',
        '  ```',
        '  新版才載得到',
        '- 上傳社群預覽圖',
        '',
        '就這兩件。',
      ].join('\n'),
    ),
  )

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await band.find({ key: 'handoffs' }))?.props.label).toBe('✋ 等你動手 2')
  await band.unmount()

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await shown(pane)).toEqual([
    '重開 app',
    '新版才載得到',
    'open -a Claude',
    '上傳社群預覽圖',
    '就這兩件。',
  ])
  await pane.unmount()
})

test('the heading option decides which block is kept and names the band', { options: { heading: '## Your turn' } }, async ($, on) => {
  engine(on)
  await $.turn.complete(turn('**等你動手**\n- not kept'))
  await $.turn.complete(turn('Done.\n\n## Your turn\n- push the branch'))

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await band.find({ key: 'handoffs' }))?.props.label).toBe('✋ Your turn 1')
  await band.unmount()
})

test('a session started in another folder and then moved to a repo shows that repo’s ledger', async ($, on) => {
  let cwd = '/spare'
  engine(on, { 'open:/repo': [{ id: 'a', at: 0, text: 'owed here' }] }, 0, () => cwd)
  await $.session.start({ cwd: '/spare', surface: 'desktop', isInteractive: true })
  cwd = '/repo'

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await band.find({ key: 'handoffs' }))?.props.label).toBe('✋ 等你動手 1')
  await band.unmount()
})
