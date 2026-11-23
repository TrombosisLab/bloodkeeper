import type {
  DisciplineKey,
} from '../types/discipline.types'

/**
 * Orientación breve para elegir una Disciplina.
 * Se mantiene fuera del catálogo que valida reglas y puntuaciones.
 */
export const disciplineCatalogHelp: Readonly<Record<DisciplineKey, string>> = {
  animalism: 'Permite percibir y comunicarse con animales, influir en su conducta y compartir algunos de sus sentidos.',
  auspex: 'Agudiza la percepción y permite descubrir presencias, impresiones y pensamientos que normalmente pasarían inadvertidos.',
  bloodSorcery: 'Permite estudiar y manipular la Sangre mediante efectos sobrenaturales; sus Poderes pueden analizarla, alterarla o emplearla contra otros.',
  celerity: 'Acelera el cuerpo y los reflejos para moverse, reaccionar y actuar a una velocidad sobrenatural.',
  dominate: 'Impone la voluntad del vampiro mediante órdenes, compulsiones y alteraciones de recuerdos.',
  fortitude: 'Refuerza el cuerpo y la voluntad para resistir daño, presión y determinados efectos sobrenaturales.',
  obfuscate: 'Oculta o altera la presencia y la apariencia del vampiro para evitar ser percibido o reconocido.',
  oblivion: 'Canaliza sombras y fuerzas vinculadas a la muerte, y permite interactuar con sus manifestaciones sobrenaturales.',
  potence: 'Confiere fuerza física sobrenatural y permite descargarla en acciones de gran impacto.',
  presence: 'Afecta las emociones y la atención de quienes rodean al vampiro, desde atraerlos hasta intimidarlos.',
  protean: 'Permite alterar el propio cuerpo, desarrollar rasgos bestiales y adoptar formas animales.',
  thinBloodAlchemy: 'Permite a los Sangre Débil preparar fórmulas alquímicas con efectos sobrenaturales. Se configura en el apartado específico de Alquimia, no como Poderes del catálogo común.',
}
