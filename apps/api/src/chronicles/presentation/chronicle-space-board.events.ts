type BoardListener = (snapshot: unknown) => void

const listeners = new Map<string, Set<BoardListener>>()

export function subscribeChronicleSpaceBoard(chronicleId: string, listener: BoardListener): () => void {
  const bucket = listeners.get(chronicleId) || new Set<BoardListener>()
  bucket.add(listener)
  listeners.set(chronicleId, bucket)
  return () => {
    bucket.delete(listener)
    if (bucket.size === 0) listeners.delete(chronicleId)
  }
}

export function publishChronicleSpaceBoard(chronicleId: string, snapshot: unknown): void {
  listeners.get(chronicleId)?.forEach((listener) => listener(snapshot))
}
