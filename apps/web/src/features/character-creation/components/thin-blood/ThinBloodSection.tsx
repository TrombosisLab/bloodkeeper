import type {
  UseThinBloodTraitsResult,
} from '../../hooks/useThinBloodTraits'

import {
  ThinBloodValidationPanel,
} from './ThinBloodValidationPanel'

import {
  ThinBloodTraitSelector,
} from './ThinBloodTraitSelector'

import {
  DisciplineAffinitySection,
} from './DisciplineAffinitySection'

import {
  ThinBloodAlchemySection,
} from './ThinBloodAlchemySection'

import {
  ClanCurseSection,
} from './ClanCurseSection'

import type {
  CharacterThinBloodAlchemyDraft,
} from '../../types/thin-blood-alchemy.types'

interface ThinBloodTraitOption {
  key: string
  name: string
}

interface ThinBloodSectionProps {
  thinBlood: UseThinBloodTraitsResult
  merits: readonly ThinBloodTraitOption[]
  flaws: readonly ThinBloodTraitOption[]

  alchemy: CharacterThinBloodAlchemyDraft

  onAlchemyChange: (
    value: CharacterThinBloodAlchemyDraft,
  ) => void
}

export function ThinBloodSection({
  thinBlood,
  merits,
  flaws,
  alchemy,
  onAlchemyChange,
}: ThinBloodSectionProps) {
  return (
    <section className="thin-blood-traits">
      <header className="advantages-category__heading">
        <div>
          <span>Sangre Débil</span>

          <h3>
            Méritos y Defectos específicos
          </h3>

          <p>
            Selecciona entre uno y tres
            Méritos y el mismo número
            de Defectos.
          </p>
        </div>

        <strong>
          {thinBlood.totalCount}
        </strong>
      </header>

      <ThinBloodValidationPanel
        valid={thinBlood.valid}
        errors={thinBlood.errors}
      />

      <div className="thin-blood-traits__columns">
        <ThinBloodTraitSelector
          title="Méritos"
          count={thinBlood.meritCount}
          traits={merits}
          thinBlood={thinBlood}
        />

        <ThinBloodTraitSelector
          title="Defectos"
          count={thinBlood.flawCount}
          traits={flaws}
          thinBlood={thinBlood}
        />
      </div>

      <DisciplineAffinitySection
        thinBlood={thinBlood}
      />

      <ThinBloodAlchemySection
        thinBlood={thinBlood}
        value={alchemy}
        onChange={onAlchemyChange}
      />

      <ClanCurseSection
        thinBlood={thinBlood}
      />
    </section>
  )
}
