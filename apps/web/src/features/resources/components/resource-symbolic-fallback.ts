type ResourceKind = 'npc' | 'location' | 'organization' | 'artifact' | 'document'

const icon: Record<ResourceKind, string> = {
  npc: '<circle cx="360" cy="362" r="72"/><path d="M220 628c12-118 71-181 140-181s128 63 140 181"/>',
  location: '<path d="M360 215c-75 0-136 61-136 136 0 101 136 269 136 269s136-168 136-269c0-75-61-136-136-136zm0 188a52 52 0 1 1 0-104 52 52 0 0 1 0 104z"/>',
  organization: '<path d="M360 210 490 285v150L360 510 230 435V285z"/><circle cx="360" cy="360" r="56"/>',
  artifact: '<path d="m360 210 114 170-114 170-114-170z"/><path d="M360 250v260M280 380h160"/>',
  document: '<path d="M245 190h190l90 90v320H245z"/><path d="M435 190v90h90M295 375h140M295 440h140M295 505h100"/>',
}

function svg(shape: string) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960"><rect width="720" height="960" fill="#100e10"/><rect x="31" y="31" width="658" height="898" rx="13" fill="none" stroke="#b99156" stroke-width="3"/><path d="M75 110h570M75 850h570" stroke="#7d2637" stroke-width="3"/><g fill="none" stroke="#bd394c" stroke-width="10" stroke-linejoin="round">${shape}</g><circle cx="360" cy="720" r="78" fill="none" stroke="#b99156" stroke-width="4"/><path d="M322 720h76M360 682v76" stroke="#b99156" stroke-width="4"/></svg>`)}`
}

export function symbolicResourceFallback(value: string): string {
  const kind = value in icon ? value as ResourceKind : 'document'
  return svg(icon[kind])
}
