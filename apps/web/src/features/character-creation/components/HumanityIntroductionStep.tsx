export function HumanityIntroductionStep() {
  return (
    <section className="humanity-introduction" aria-labelledby="humanity-introduction-title">
      <div className="creation-step-heading">
        <span>Fase final · Humanidad</span>
        <h2 id="humanity-introduction-title">Lo que aún te mantiene humano</h2>
        <p>
          Antes de definir los vínculos de tu personaje, entiende qué representa
          su Humanidad y por qué sus Convicciones y Piedras de Toque importan.
        </p>
      </div>

      <div className="humanity-introduction__grid">
        <article className="humanity-introduction__card">
          <span>Tu relación con la Bestia</span>
          <h3>Humanidad</h3>
          <p>
            No es una puntuación de bondad. Representa cuánto conserva el Vástago
            de sus límites, valores e identidad frente a la Bestia. Puede ponerse
            a prueba y cambiar a lo largo de la historia.
          </p>
        </article>

        <article className="humanity-introduction__card">
          <span>Principios personales</span>
          <h3>Convicciones</h3>
          <p>
            Son reglas propias que orientan las decisiones del personaje, sobre
            todo cuando la no-vida le empuja a cruzar sus límites. Procura
            expresarlas de forma concreta y significativa para él.
          </p>
        </article>

        <article className="humanity-introduction__card">
          <span>Vínculos con el mundo mortal</span>
          <h3>Piedras de Toque</h3>
          <p>
            Son personas mortales que representan una Convicción en la vida del
            Vástago. Cada principio se vincula a una persona y a una relación
            concreta; lo que les ocurra puede poner a prueba aquello que el
            personaje intenta preservar.
          </p>
        </article>
      </div>

      <p className="humanity-introduction__note">
        En el siguiente paso verás la Humanidad inicial ya calculada y podrás
        definir de una a tres Convicciones, cada una ligada a su Piedra de Toque.
        Estos vínculos dan al Narrador y al jugador motivos personales para que
        las decisiones morales tengan peso en la crónica.
      </p>
    </section>
  )
}
