import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Req } from '@nestjs/common'
import { ManageChronicleParticipantNotesUseCase } from '../application/manage-chronicle-participant-notes.use-case'
import { ChronicleParticipantPermissionError } from '../application/list-chronicle-participants.use-case'
import { ChronicleParticipantWriteConflictError } from '../application/chronicle-participant.repository'
import { parseChronicleIdParam, parseChronicleNarratorId } from './chronicle.dto'
import { parseParticipantIdParam } from './chronicle-participant.dto'

function body(value:unknown){if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('INVALID');const v=value as Record<string,unknown>;if(Object.keys(v).some(k=>k!=='expectedRevision'&&k!=='narratorNotes')||!Number.isInteger(v.expectedRevision)||typeof v.expectedRevision!=='number'||v.expectedRevision<1||(typeof v.narratorNotes!=='string'&&v.narratorNotes!==null))throw new Error('INVALID');return {expectedRevision:v.expectedRevision,narratorNotes:v.narratorNotes}}
@Controller('chronicles')
export class ChronicleParticipantNotesController {
 constructor(private readonly notes:ManageChronicleParticipantNotesUseCase){}
 private actor(request:{readonly user?:{readonly id?:unknown}}){return parseChronicleNarratorId(request.user?.id)}
 private fail(error:unknown):never {if(error instanceof ChronicleParticipantPermissionError)throw new ForbiddenException({code:'CHRONICLE_PARTICIPANT_PERMISSION_DENIED'});if(error instanceof ChronicleParticipantWriteConflictError)throw new ForbiddenException({code:'CHRONICLE_PARTICIPANT_WRITE_CONFLICT'});throw error}
 @Get(':chronicleId/participants/:participantId/narrator-notes') async load(@Req() request:{readonly user?:{readonly id?:unknown}},@Param('chronicleId') c:unknown,@Param('participantId') p:unknown){try{const item=await this.notes.load(this.actor(request),parseChronicleIdParam(c),parseParticipantIdParam(p));if(item===null)throw new NotFoundException({code:'CHRONICLE_PARTICIPANT_NOT_FOUND'});return {narratorNotes:item.narratorNotes,revision:item.revision}}catch(error){this.fail(error)}}
 @Patch(':chronicleId/participants/:participantId/narrator-notes') async update(@Req() request:{readonly user?:{readonly id?:unknown}},@Param('chronicleId') c:unknown,@Param('participantId') p:unknown,@Body() payload:unknown){try{const chronicleId=parseChronicleIdParam(c),participantId=parseParticipantIdParam(p),data=body(payload);const item=await this.notes.update(this.actor(request),{chronicleId,participantId,...data});if(item===null)throw new NotFoundException({code:'CHRONICLE_PARTICIPANT_NOT_FOUND'});return {narratorNotes:item.narratorNotes,revision:item.revision}}catch(error){this.fail(error)}}
}
