export type Suggestions = string[]

declare module 'claude-code' {
  interface PluginState {
    'suggestion-replies': { suggestions: Suggestions; turnId: string | null; answer: string | null }
  }
}
