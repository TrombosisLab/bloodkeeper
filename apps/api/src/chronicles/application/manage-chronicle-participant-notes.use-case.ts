import { Inject, Injectable } from '@nestjs/common'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from './chronicle-participant.repository'
import type { ChronicleParticipantRepository } from './chronicle-participant.repository'
import type { UpdateChronicleParticipantNarratorNotesData } from '../domain/chronicle-participant.types'
import { ChronicleParticipantPermissionError } from './list-chronicle-participants.use-case'

@Injectable()
export class ManageChronicleParticipantNotesUseCase {
  constructor(@Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly repository: ChronicleParticipantRepository) {}
  async load(actorUserId:string, chronicleId:string, participantId:string) {
    const actor=await this.repository.findActiveMembership(chronicleId,actorUserId)
    if(actor===null||actor.role!=='narrator') throw new ChronicleParticipantPermissionError()
    return this.repository.findById(chronicleId,participantId)
  }
  async update(actorUserId:string, data:UpdateChronicleParticipantNarratorNotesData) {
    const actor=await this.repository.findActiveMembership(data.chronicleId,actorUserId)
    if(actor===null||actor.role!=='narrator') throw new ChronicleParticipantPermissionError()
    const target=await this.repository.findById(data.chronicleId,data.participantId)
    if(target===null) return null
    return this.repository.updateNarratorNotes(data)
  }
}
