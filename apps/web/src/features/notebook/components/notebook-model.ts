export type Mention = { targetType: string; targetId: string; label: string }
const tokenSource = String.raw`@\[([^\]]+)\]\((NPC|LOCATION|SESSION|ORGANIZATION|ARTIFACT|DOCUMENT|RESOURCE|CHARACTER|EVENT|STORY):([^\)]+)\)`
export function parseMentions(content: string) {
  return Array.from(content.matchAll(new RegExp(tokenSource, 'g')), (match) => ({
    start: match.index!, end: match.index! + match[0].length,
    targetType: match[2]!, targetId: match[3]!, label: match[1]!,
  }))
}
export function readable(content: string) { return content.replace(new RegExp(tokenSource, 'g'), '@$1') }
export function tagKey(tag: string) { return tag.trim().replace(/^#/, '').normalize('NFC').toLocaleLowerCase('es-ES') }
export function mentionAt(content: string, caret: number) {
  const before = content.slice(0, caret)
  const match = before.match(/(?:^|[\s(])@([^@\n\[\]]{0,80})$/)
  return match ? { start: caret - match[1]!.length - 1, end: caret, query: match[1]! } : null
}
export function insertMention(content: string, caret: number, label: string) {
  const range = mentionAt(content, caret)
  const start = range?.start ?? caret
  const replacement = '@' + label + ' '
  return { content: content.slice(0, start) + replacement + content.slice(caret), caret: start + replacement.length }
}
export function uniqueReferences(refs: readonly Mention[]) {
  return [...new Map(refs.map((ref) => [ref.targetType + ':' + ref.targetId, ref])).values()]
}
export function serializeMentions(content: string, options: readonly Mention[]) {
  // One replacement pass avoids converting pieces of already serialized tokens.
  const byLabel = new Map<string, Mention>()
  for (const option of options) if (!byLabel.has(option.label.toLocaleLowerCase('es-ES'))) byLabel.set(option.label.toLocaleLowerCase('es-ES'), option)
  const labels = [...byLabel.values()].sort((a, b) => b.label.length - a.label.length)
  if (!labels.length) return content
  const escaped = labels.map((item) => item.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp('(^|[\\s(])@(' + escaped.join('|') + ')(?=$|[\\s.,;:!?)])', 'gi')
  return content.replace(pattern, (_whole, prefix: string, label: string) => {
    const ref = byLabel.get(label.toLocaleLowerCase('es-ES'))!
    return prefix + '@[' + ref.label + '](' + ref.targetType + ':' + ref.targetId + ')'
  })
}
