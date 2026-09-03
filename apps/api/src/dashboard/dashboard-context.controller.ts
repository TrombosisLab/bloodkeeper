import { BadRequestException, Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
@Controller('dashboard')
export class DashboardContextController {
 constructor(private readonly database:DatabaseService){}
 @Get('context') async context(@Req() request:any,@Query() query:any){
  const userId=request?.user?.id
  if(!uuid(userId)) throw new UnauthorizedException({code:'AUTHENTICATION_REQUIRED'})
  if(query.chronicleId!==undefined&&!uuid(query.chronicleId)) throw new BadRequestException({code:'INVALID_DASHBOARD_CONTEXT'})
  if(query.characterId!==undefined&&!uuid(query.characterId)) throw new BadRequestException({code:'INVALID_DASHBOARD_CONTEXT'})
  const db:any=this.database
  const memberships=await db.chronicleParticipant.findMany({where:{userId,status:'ACTIVE'},include:{chronicle:true},orderBy:{updatedAt:'desc'}})
  const chronicles=memberships.filter((m:any)=>String(m.chronicle.status)!=='ARCHIVED')
  const preference=await db.userDashboardContext.findUnique({where:{userId}})
  const requested=chronicles.find((m:any)=>m.chronicleId===query.chronicleId)
  const remembered=chronicles.find((m:any)=>m.chronicleId===preference?.chronicleId)
  const membership=requested??remembered??chronicles[0]??null
  if(!membership) return {chronicles:[],continuation:null,selectedChronicle:null,characters:[],selectedCharacter:null,session:null,previousSession:null,context:null,pending:{experience:0,publicNotes:0}}
  const chars=(await db.character.findMany({where:{ownerId:userId,chronicleId:membership.chronicleId},include:{identity:true,blood:true,damage:true,humanity:true,attributes:true},orderBy:{updatedAt:'desc'}})).filter((c:any)=>String(c.status)!=='ARCHIVED')
  const selected=chars.find((c:any)=>c.id===query.characterId)||chars.find((c:any)=>c.id===preference?.characterId)||chars[0]||null
  const sessions=await db.chronicleSession.findMany({where:{chronicleId:membership.chronicleId},include:{scenes:{orderBy:{sortOrder:'asc'}}},orderBy:{updatedAt:'desc'}})
  const session=sessions.find((s:any)=>String(s.status)==='PREPARATION')||sessions[0]||null
  const previous=sessions.find((s:any)=>String(s.status)==='COMPLETED'||String(s.status)==='ARCHIVED')||null
  let context:any=null, publicNotes=0
  if(session){
   const [events,npcs,locations,resources,notes]=await Promise.all([
    db.chronicleSessionEvent.findMany({where:{sessionId:session.id},include:{event:true}}),db.chronicleSessionNpc.findMany({where:{sessionId:session.id},include:{npc:true}}),db.chronicleSessionLocation.findMany({where:{sessionId:session.id},include:{location:true}}),db.chronicleSessionResource.findMany({where:{sessionId:session.id},include:{resource:true}}),db.chronicleSessionParticipantNote.count({where:{sessionId:session.id,publicNotes:{not:null}}})])
   publicNotes=notes
   const visible=resources.map((x:any)=>x.resource).filter((r:any)=>String(membership.role)==='NARRATOR'||r.visibility==='chronicle_participants')
   context={location:locations[0]?.location?{name:locations[0].location.name,detail:locations[0].location.category}:null,npc:npcs[0]?.npc?{name:npcs[0].npc.name,detail:npcs[0].npc.narrativeRole||npcs[0].npc.category}:null,organization:visible.find((r:any)=>String(r.kind)==='ORGANIZATION')?{name:visible.find((r:any)=>String(r.kind)==='ORGANIZATION').name,detail:visible.find((r:any)=>String(r.kind)==='ORGANIZATION').summary}:null,threat:events[0]?.event?{name:events[0].event.title,detail:events[0].event.description}:null}
  }
  let experience=0
  if(selected){const moves=await db.characterExperienceMovement.findMany({where:{characterId:selected.id},select:{amount:true,component:true}});experience=moves.reduce((n:number,m:any)=>n+(String(m.component)==='EARNED'?m.amount:-m.amount),0)}
  await db.userDashboardContext.upsert({where:{userId},create:{userId,chronicleId:membership.chronicleId,characterId:selected?.id??null,sessionId:session?.id??null},update:{chronicleId:membership.chronicleId,characterId:selected?.id??null,sessionId:session?.id??null}})
  const card=(m:any)=>({id:m.chronicle.id,name:m.chronicle.name,description:m.chronicle.description,status:String(m.chronicle.status).toLowerCase(),characterCount:chars.length})
  const character=selected?{id:selected.id,name:selected.identity?.name||'Personaje sin nombre',concept:selected.identity?.concept||null,clan:selected.identity?.clanKey||null,ambition:selected.identity?.ambition||null,desire:selected.identity?.desire||null,hunger:selected.blood?.hunger??0,bloodPotency:selected.blood?.bloodPotency??0,humanity:selected.humanity?.value??7,health:{current:Math.max(0,(selected.attributes?.stamina??1)+3-(selected.damage?.healthSuperficial??0)-(selected.damage?.healthAggravated??0)),maximum:(selected.attributes?.stamina??1)+3},willpower:{current:Math.max(0,(selected.attributes?.resolve??1)+(selected.attributes?.composure??1)-(selected.damage?.willpowerSuperficial??0)-(selected.damage?.willpowerAggravated??0)),maximum:(selected.attributes?.resolve??1)+(selected.attributes?.composure??1)}}:null
  return {chronicles:chronicles.map(card),continuation:preference?.chronicleId?{chronicleId:preference.chronicleId,characterId:preference.characterId}:null,selectedChronicle:{id:membership.chronicle.id,name:membership.chronicle.name,description:membership.chronicle.description,currentSituation:membership.chronicle.currentSituation},characters:chars.map((c:any)=>({id:c.id,name:c.identity?.name||'Personaje sin nombre',clan:c.identity?.clanKey||null})),selectedCharacter:character,session:session?{id:session.id,title:session.title||'Sesion sin titulo',status:String(session.status).toLowerCase(),objective:session.objective,scene:session.scenes.find((s:any)=>String(s.status)==='PENDING')?.title||session.scenes[0]?.title||null}:null,previousSession:previous?{title:previous.title||'Sesion anterior',summary:previous.summary}:null,context,pending:{experience,publicNotes}}
 }
}
