import { getClanDefinition } from '../data/clan-definitions'
import type { ClanKey } from '../types/clan.types'

interface DisciplineIntroductionStepProps {
  clanKey: ClanKey
}

export function DisciplineIntroductionStep({
  clanKey,
}: DisciplineIntroductionStepProps) {
  const clan = getClanDefinition(clanKey)

  if (clan.kind === 'thinBlood') {
    return (
      <section className="discipline-introduction" aria-labelledby="discipline-introduction-title">
        <div className="creation-step-heading">
          <span>Fase 5 · Disciplinas</span>
          <h2 id="discipline-introduction-title">Una excepción: Sangre Débil</h2>
          <p>
            No recibirás el reparto inicial 2 + 1 de los vampiros de clan.
            Esta fase mostrará las opciones sobrenaturales específicas de la Sangre Débil.
          </p>
        </div>
        <div className="discipline-introduction__grid">
          <article className="discipline-introduction__card">
            <span>Regla especial</span>
            <h3>Sin reparto de clan</h3>
            <p>
              No tienes que escoger dos Disciplinas de clan ni distribuir puntos entre ellas.
              La Alquimia de Sangre Débil se tratará con sus reglas propias.
            </p>
          </article>
        </div>
      </section>
    )
  }

  const isCaitiff = clan.kind === 'caitiff'

  return (
    <section className="discipline-introduction" aria-labelledby="discipline-introduction-title">
      <div className="creation-step-heading">
        <span>Fase 5 · Disciplinas</span>
        <h2 id="discipline-introduction-title">Antes de elegir tus Disciplinas</h2>
        <p>
          Las Disciplinas son capacidades sobrenaturales. Primero elegirás cuáles desarrolla
          el personaje y después escogerás sus Poderes.
        </p>
      </div>

      <div className="discipline-introduction__grid">
        <article className="discipline-introduction__card">
          <span>Qué vas a repartir</span>
          <h3>Dos Disciplinas · 2 + 1</h3>
          <p>
            Asigna dos puntos a una Disciplina y un punto a otra distinta.
            No se pueden repartir como tres disciplinas de un punto.
          </p>
        </article>

        <article className="discipline-introduction__card">
          <span>{isCaitiff ? 'Opciones Caitiff' : `Opciones de ${clan.name}`}</span>
          <h3>{isCaitiff ? 'Elección libre' : 'Disciplinas del clan'}</h3>
          <p>
            {isCaitiff
              ? 'Puedes elegir dos Disciplinas vampíricas disponibles, aunque no sean de un clan.'
              : 'Durante la creación, elige entre las Disciplinas propias de tu clan.'}
          </p>
        </article>

        <article className="discipline-introduction__card">
          <span>Después del reparto</span>
          <h3>Escoge los Poderes</h3>
          <p>
            Cada punto de una Disciplina requiere un Poder de ese nivel.
            Una Disciplina a nivel 2 necesita dos Poderes; una a nivel 1, uno.
          </p>
        </article>

        <article className="discipline-introduction__card discipline-introduction__card--derived">
          <span>Concesión adicional</span>
          <h3>Tipo de Depredador</h3>
          <p>
            Si tu Tipo de Depredador concede una Disciplina, se añade aparte:
            no consume el reparto 2 + 1, pero también tendrás que escoger su Poder.
          </p>
        </article>
      </div>
    </section>
  )
}
