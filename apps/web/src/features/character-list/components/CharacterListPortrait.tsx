import { useEffect, useState } from "react"
import { V5VisualMark } from "../../v5-visuals/V5VisualMark"

interface CharacterListPortraitProps {
  readonly characterId: string
}

function clanFrom(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const identity = record.identity
  if (typeof identity === "object" && identity !== null && !Array.isArray(identity)) {
    const identityRecord = identity as Record<string, unknown>
    const identityClan = identityRecord.clan ?? identityRecord.clanKey
    if (typeof identityClan === "string" && identityClan.trim() !== "") return identityClan
  }
  const clan = record.clan ?? record.clanKey
  return typeof clan === "string" && clan.trim() !== "" ? clan : null
}

export function CharacterListPortrait({
  characterId,
}: CharacterListPortraitProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fallbackClan, setFallbackClan] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    fetch(`/api/characters/${encodeURIComponent(characterId)}/portrait`, {
      credentials: "include",
    })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (blob === null) {
          return fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
            credentials: "include",
          })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload) => {
              if (!cancelled) setFallbackClan(clanFrom(payload))
            })
        }
        const nextUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(nextUrl)
          return
        }
        objectUrl = nextUrl
        setImageUrl(nextUrl)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [characterId])

  return (
    <div className="character-list-card__portrait" aria-hidden="true">
      {imageUrl ? (
        <img src={imageUrl} alt="" />
      ) : (
        <V5VisualMark kind="clan-symbol" value={fallbackClan} decorative />
      )}
    </div>
  )
}
