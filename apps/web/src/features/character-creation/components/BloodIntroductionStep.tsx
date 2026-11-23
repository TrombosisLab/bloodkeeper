import { getBloodPotencyRange } from '../domain/blood-rules'

interface BloodIntroductionStepProps {
  generation: number
  bloodPotency: number
  hunger: number
}

export function BloodIntroductionStep({
  generation,
  bloodPotency,
  hunger,
}: BloodIntroductionStepProps) {
  const range = getBloodPotencyRange(generation as 10 | 11 | 12 | 13 | 14 | 15 | 16)

  return (
    <section
      className="blood-introduction"
      aria-labelledby="blood-introduction-title"
    >
      <div className="creation-step-heading">
        <span>Fase 4 · Sangre</span>
        <h2 id="blood-introduction-title">Antes de ajustar la Sangre</h2>
        <p>
          Esta fase no tiene un reparto de puntos. La Generación ya se decidió
          en Identidad; ahora revisarás la Potencia de Sangre y el Hambre inicial.
        </p>
      </div>

      <div className="blood-introduction__grid">
        <article className="blood-introduction__card">
          <span>Decisión anterior</span>
          <h3>Generación {generation}.ª</h3>
          <p>
            La Generación determina qué rango de Potencia de Sangre puede tener
            el personaje. No hace falta volver a elegirla aquí.
          </p>
        </article>

        <article className="blood-introduction__card">
          <span>Valor ajustable</span>
          <h3>Potencia de Sangre</h3>
          <p>
            Indica la fuerza de la sangre vampírica. El rango permitido para
            esta Generación es de {range.min} a {range.max}; el valor actual es
            {bloodPotency}. Puedes dejar el valor inicial o ajustarlo dentro de
            ese margen.
          </p>
        </article>

        <article className="blood-introduction__card">
          <span>Estado inicial</span>
          <h3>Hambre {hunger}</h3>
          <p>
            El Hambre va de 0 a 5 y refleja la necesidad de alimentarse.
            El creador propone 1 como valor inicial; ajústalo si vuestra mesa
            ha acordado otro comienzo.
          </p>
        </article>

        <article className="blood-introduction__card blood-introduction__card--derived">
          <span>Calculados automáticamente</span>
          <h3>Salud y Fuerza de Voluntad</h3>
          <p>
            No se reparten ni se compran: la Salud se calcula con Resistencia,
            y la Fuerza de Voluntad con Compostura y Resolución.
          </p>
        </article>
      </div>
    </section>
  )
}
