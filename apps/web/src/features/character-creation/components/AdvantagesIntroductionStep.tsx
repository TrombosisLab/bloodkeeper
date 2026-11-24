export function AdvantagesIntroductionStep() {
  return (
    <section className="advantages-introduction" aria-labelledby="advantages-introduction-title">
      <div className="creation-step-heading">
        <h2 id="advantages-introduction-title">Antes de abrir el catálogo</h2>
        <p>
          “Ventajas” es el nombre general de este apartado. Dentro encontrarás
          Méritos y Trasfondos; los Defectos son el lado negativo. El catálogo
          indicará el coste y las reglas de cada opción.
        </p>
      </div>

      <div className="advantages-introduction__grid">
        <article className="advantages-introduction__card">
          <span>El apartado completo</span>
          <h3>Ventajas</h3>
          <p>
            Es el conjunto de opciones favorables que ayudan a definir qué sabe
            hacer tu personaje y con qué cuenta.
          </p>
        </article>

        <article className="advantages-introduction__card">
          <span>Rasgos del personaje</span>
          <h3>Méritos</h3>
          <p>
            Son cualidades, aptitudes o particularidades especiales del personaje
            que ofrecen un beneficio concreto.
          </p>
        </article>

        <article className="advantages-introduction__card">
          <span>Lo que tiene a su alcance</span>
          <h3>Trasfondos</h3>
          <p>
            Representan recursos y relaciones externas: contactos, aliados,
            refugio, rebaño, influencia o recursos económicos.
          </p>
        </article>

        <article className="advantages-introduction__card advantages-introduction__card--derived">
          <span>Complicaciones</span>
          <h3>Defectos</h3>
          <p>
            Añaden desventajas o problemas narrativos. Algunos son personales;
            otros afectan a un Trasfondo, como un refugio comprometido.
          </p>
        </article>
      </div>

    </section>
  )
}
