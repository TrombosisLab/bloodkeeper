import type {
  UseThinBloodTraitsResult,
} from '../../hooks/useThinBloodTraits'

interface ThinBloodTraitOption {
  key: string
  name: string
}

interface ThinBloodTraitSelectorProps {
  title: string
  count: number
  traits: readonly ThinBloodTraitOption[]
  thinBlood: UseThinBloodTraitsResult
}

export function ThinBloodTraitSelector({
  title,
  count,
  traits,
  thinBlood,
}: ThinBloodTraitSelectorProps) {
  return (
    <section className="thin-blood-traits__group">
      <header>
        <div>
          <span>Catálogo CORE</span>
          <h4>{title}</h4>
        </div>

        <strong>{count} / 3</strong>
      </header>

      <div className="thin-blood-traits__options">
        {traits.map((trait) => {
          const selected = thinBlood.isSelected(trait.key)

          return (
            <button
              key={trait.key}
              type="button"
              className={
                selected
                  ? 'thin-blood-trait-option thin-blood-trait-option--selected'
                  : 'thin-blood-trait-option'
              }
              aria-pressed={selected}
              onClick={() => thinBlood.toggle(trait.key)}
            >
              <span>{trait.name}</span>

              <small>
                {selected
                  ? 'Seleccionado'
                  : 'Seleccionar'}
              </small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
