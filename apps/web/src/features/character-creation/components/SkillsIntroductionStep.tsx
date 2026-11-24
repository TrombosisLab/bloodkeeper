const levels = [
  { rating: 'Sin puntos', meaning: 'No entrenada' },
  { rating: '1', meaning: 'Básica' },
  { rating: '2', meaning: 'Competente' },
  { rating: '3', meaning: 'Destacada' },
  { rating: '4', meaning: 'Experta' },
] as const

const profiles = [
  {
    name: 'Generalista',
    description:
      'Amplio abanico, sobre todo básico y competente; sin nivel experto.',
    distribution:
      '10 básicas · 8 competentes · 1 destacada · 8 sin puntos',
  },
  {
    name: 'Equilibrado',
    description:
      'Combina cobertura con varias habilidades destacadas; sin nivel experto.',
    distribution:
      '7 básicas · 5 competentes · 3 destacadas · 12 sin puntos',
  },
  {
    name: 'Especialista',
    description:
      'Menos habilidades entrenadas, pero una puede llegar al nivel experto.',
    distribution:
      '3 básicas · 3 competentes · 3 destacadas · 1 experta · 17 sin puntos',
  },
] as const

export function SkillsIntroductionStep() {
  return (
    <section
      className="skills-introduction"
      aria-labelledby="skills-introduction-title"
    >
      <div className="creation-step-heading">
        <h2 id="skills-introduction-title">
          Antes de repartir, entiende tus opciones
        </h2>
        <p>
          Tienes 27 habilidades. Cada perfil propone cuántas desarrollar en cada
          nivel; después podrás ajustar el reparto.
        </p>
      </div>

      <section
        className="skills-introduction__section"
        aria-labelledby="skills-introduction-levels-title"
      >
        <h3 id="skills-introduction-levels-title">
          Qué significa cada nivel
        </h3>
        <div className="skills-introduction__levels">
          {levels.map((level) => (
            <div
              className="skills-introduction__level"
              key={level.rating}
            >
              <strong>{level.rating}</strong>
              <span>{level.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        className="skills-introduction__section"
        aria-labelledby="skills-introduction-profiles-title"
      >
        <h3 id="skills-introduction-profiles-title">
          Tres caminos para repartir
        </h3>
        <div className="skills-introduction__profiles">
          {profiles.map((profile) => (
            <article
              className="skills-introduction__profile"
              key={profile.name}
            >
              <h4>{profile.name}</h4>
              <p>{profile.description}</p>
              <small>{profile.distribution}</small>
            </article>
          ))}
        </div>
      </section>

      <p className="skills-introduction__method-note" role="note">
        Elegir un perfil no asigna los puntos por sí solo. En la siguiente
        pantalla podrás repartirlos manualmente o pulsar «Reparto aleatorio válido».
      </p>

      <section
        className="skills-introduction__specialties"
        aria-labelledby="skills-introduction-specialties-title"
      >
        <h3 id="skills-introduction-specialties-title">
          Especializaciones
        </h3>
        <p>
          Tienes una especialización libre para cualquiera de las 27
          habilidades, siempre que tenga al menos 1 punto. Academicismo,
          Artesanía, Ciencia e Interpretación requieren además una propia cuando
          tienen puntuación. Las del Tipo de Depredador se añaden aparte y no
          consumen esos cupos.
        </p>
      </section>
    </section>
  )
}
