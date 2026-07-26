export interface DisciplineAffinityOption {
  key: string
  name: string
}

export interface DisciplineAffinityPowerOption {
  key: string
  name: string
}

interface DisciplineAffinityEditorProps {
  discipline: string | null
  power: string | null
  disciplines: readonly DisciplineAffinityOption[]
  powers: readonly DisciplineAffinityPowerOption[]
  onDisciplineChange: (value: string) => void
  onPowerChange: (value: string) => void
}

export function DisciplineAffinityEditor({
  discipline,
  power,
  disciplines,
  powers,
  onDisciplineChange,
  onPowerChange,
}: DisciplineAffinityEditorProps) {
  const selectedDiscipline = discipline ?? ''
  const selectedPower = power ?? ''
  const powerSelectionDisabled = selectedDiscipline === ''

  return (
    <section className="discipline-affinity-editor">
      <header className="discipline-affinity-editor__header">
        <div>
          <span>Mérito de Sangre Débil</span>
          <h4>Disciplina Afín</h4>
        </div>

        <p>
          Elige una Disciplina y después uno de sus poderes
          disponibles.
        </p>
      </header>

      <div className="discipline-affinity-editor__fields">
        <label className="discipline-affinity-editor__field">
          <span>Disciplina</span>

          <select
            value={selectedDiscipline}
            onChange={(event) => {
              onDisciplineChange(event.target.value)
            }}
          >
            <option value="">
              Selecciona una Disciplina
            </option>

            {disciplines.map((option) => (
              <option
                key={option.key}
                value={option.key}
              >
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="discipline-affinity-editor__field">
          <span>Poder de nivel 1</span>

          <select
            value={selectedPower}
            disabled={powerSelectionDisabled}
            onChange={(event) => {
              onPowerChange(event.target.value)
            }}
          >
            <option value="">
              {powerSelectionDisabled
                ? 'Selecciona primero una Disciplina'
                : 'Selecciona un Poder'}
            </option>

            {powers.map((option) => (
              <option
                key={option.key}
                value={option.key}
              >
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
