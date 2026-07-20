import type {
  DisciplineKey,
} from './discipline.types'

export type ClanKey =
  | 'banuHaqim'
  | 'brujah'
  | 'caitiff'
  | 'gangrel'
  | 'hecata'
  | 'lasombra'
  | 'malkavian'
  | 'ministry'
  | 'nosferatu'
  | 'ravnos'
  | 'salubri'
  | 'thinBlood'
  | 'toreador'
  | 'tremere'
  | 'tzimisce'
  | 'ventrue'

export type ClanKind =
  | 'clan'
  | 'caitiff'
  | 'thinBlood'

export interface ClanDefinition {
  key: ClanKey
  name: string
  kind: ClanKind
  inClanDisciplines: DisciplineKey[]
}
