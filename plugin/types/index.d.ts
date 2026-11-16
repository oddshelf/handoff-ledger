export type Handoff = { id: string; at: number; text: string; command?: string; note?: string }

declare module 'claude-code' {
  interface PluginState {
    'handoff-ledger': { open: Shaped<Handoff[]> }
  }
}
