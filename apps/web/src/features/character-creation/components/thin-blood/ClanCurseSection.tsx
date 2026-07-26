import type {
  UseThinBloodTraitsResult,
} from '../../hooks/useThinBloodTraits'

interface ClanCurseSectionProps {
  thinBlood: UseThinBloodTraitsResult
}

export function ClanCurseSection({
  thinBlood,
}: ClanCurseSectionProps) {
  if (
    !thinBlood.isSelected(
      'clan-curse',
    )
  ) {
    return null
  }

  return <></>
}
