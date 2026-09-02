import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Req, UnauthorizedException } from '@nestjs/common'
import { LoadChronicleSessionWorkspaceUseCase } from '../application/load-chronicle-session-workspace.use-case'
import { ChronicleSessionPermissionError } from '../application/chronicle-session-permission'
import { ChronicleSessionWorkspaceConflictError, ChronicleSessionWorkspaceItemNotFoundError, ChronicleSessionWorkspaceNotEditableError, ManageChronicleSessionWorkspaceUseCase } from '../application/manage-chronicle-session-workspace.use-case'
import { parseChronicleSessionIdParam } from './chronicle-session.dto'
import { parseChronicleIdParam, parseChronicleNarratorId } from './chronicle.dto'
interface RequestWithUser { readonly user?: { readonly id?: unknown } }
@Controller('chronicles/:chronicleId/sessions/:sessionId/workspace')
export class ChronicleSessionWorkspaceController {
  constructor(private readonly loadWorkspace: LoadChronicleSessionWorkspaceUseCase, private readonly manageWorkspace: ManageChronicleSessionWorkspaceUseCase) {}
  private actor(request: RequestWithUser): string { try { return parseChronicleNarratorId(request.user?.id) } catch { throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' }) } }
  private ids(chronicleIdInput: unknown, sessionIdInput: unknown) { return { chronicleId: parseChronicleIdParam(chronicleIdInput), sessionId: parseChronicleSessionIdParam(sessionIdInput) } }
  private uuid(value: unknown, field: string): string { if(typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new BadRequestException({code:'INVALID_CHRONICLE_SESSION_WORKSPACE_REQUEST',field}); return value }
  private revision(value: unknown): number { if(!Number.isInteger(value) || Number(value)<1) throw new BadRequestException({code:'INVALID_CHRONICLE_SESSION_WORKSPACE_REQUEST',field:'expectedRevision'}); return Number(value) }
  private scene(body: any) { if(!body || typeof body!=='object' || typeof body.title!=='string' || body.title.trim().length<1) throw new BadRequestException({code:'INVALID_CHRONICLE_SESSION_WORKSPACE_REQUEST'}); return {title:body.title.trim(),purpose:typeof body.purpose==='string'?body.purpose.trim()||null:null,narrativePhase:typeof body.narrativePhase==='string'?body.narrativePhase.trim()||null:null,intensity:body.intensity===null||body.intensity===undefined?null:Number(body.intensity),completed:body.completed===true} }
  private preparation(body: any) { if(!body || typeof body!=='object' || typeof body.text!=='string' || body.text.trim().length<1) throw new BadRequestException({code:'INVALID_CHRONICLE_SESSION_WORKSPACE_REQUEST'}); return {text:body.text.trim(),completed:body.completed===true} }
  private failure(error: unknown): never { if(error instanceof ChronicleSessionPermissionError) throw new ForbiddenException({code:'CHRONICLE_SESSION_PERMISSION_DENIED'}); if(error instanceof ChronicleSessionWorkspaceNotEditableError) throw new ConflictException({code:'CHRONICLE_SESSION_WORKSPACE_NOT_EDITABLE'}); if(error instanceof ChronicleSessionWorkspaceConflictError) throw new ConflictException({code:'CHRONICLE_SESSION_WORKSPACE_REVISION_CONFLICT'}); if(error instanceof ChronicleSessionWorkspaceItemNotFoundError) throw new NotFoundException({code:'CHRONICLE_SESSION_NOT_FOUND'}); throw error }
  @Post('scenes') async createScene(@Req() request:RequestWithUser,@Param('chronicleId') c:unknown,@Param('sessionId') s:unknown,@Body() body:unknown){try{const ids=this.ids(c,s);return await this.manageWorkspace.createScene(this.actor(request),ids.chronicleId,ids.sessionId,this.scene(body))}catch(e){this.failure(e)}}
  @Patch('scenes/:sceneId') async updateScene(@Req() request:RequestWithUser,@Param('chronicleId') c:unknown,@Param('sessionId') s:unknown,@Param('sceneId') item:unknown,@Body() body:any){try{const ids=this.ids(c,s);return await this.manageWorkspace.updateScene(this.actor(request),ids.chronicleId,ids.sessionId,this.uuid(item,'sceneId'),this.revision(body?.expectedRevision),this.scene(body))}catch(e){this.failure(e)}}
  @Post('preparation-items') async createPreparation(@Req() request:RequestWithUser,@Param('chronicleId') c:unknown,@Param('sessionId') s:unknown,@Body() body:unknown){try{const ids=this.ids(c,s);return await this.manageWorkspace.createPreparationItem(this.actor(request),ids.chronicleId,ids.sessionId,this.preparation(body))}catch(e){this.failure(e)}}
  @Patch('preparation-items/:itemId') async updatePreparation(@Req() request:RequestWithUser,@Param('chronicleId') c:unknown,@Param('sessionId') s:unknown,@Param('itemId') item:unknown,@Body() body:any){try{const ids=this.ids(c,s);return await this.manageWorkspace.updatePreparationItem(this.actor(request),ids.chronicleId,ids.sessionId,this.uuid(item,'itemId'),this.revision(body?.expectedRevision),this.preparation(body))}catch(e){this.failure(e)}}
  @Get()
  async load(@Req() request: RequestWithUser, @Param('chronicleId') chronicleIdInput: unknown, @Param('sessionId') sessionIdInput: unknown) {
    let actorUserId: string
    try { actorUserId = parseChronicleNarratorId(request.user?.id) } catch { throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' }) }
    try {
      const sessionId = parseChronicleSessionIdParam(sessionIdInput)
      const workspace = await this.loadWorkspace.execute(actorUserId, parseChronicleIdParam(chronicleIdInput), sessionId)
      if (workspace === null) throw new NotFoundException({ code: 'CHRONICLE_SESSION_NOT_FOUND' })
      return workspace
    } catch (error: unknown) {
      if (error instanceof ChronicleSessionPermissionError) throw new ForbiddenException({ code: 'CHRONICLE_SESSION_PERMISSION_DENIED' })
      throw error
    }
  }
}
