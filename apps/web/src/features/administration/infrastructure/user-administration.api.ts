import type { AdministrationRole, AdministrationStatus, AdministrationUser, AdministrationUserListQuery, AdministrationUserPage, CreateAdministrationUser } from '../types/user-administration.types'
export class UserAdministrationApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string) {
    super(code)
    this.name = 'UserAdministrationApiError'
    this.status = status
    this.code = code
  }
}
async function request(path:string, init:RequestInit={}):Promise<Response>{ const response=await fetch(path,{...init,headers:{'Content-Type':'application/json',...(init.headers ?? {})},credentials:'include'}); if(!response.ok){ let code='ADMINISTRATION_REQUEST_FAILED'; try { code=(await response.json()).code ?? code } catch {} throw new UserAdministrationApiError(response.status,code) }; return response }
export function createUserAdministrationGateway(){ return { async list(query:AdministrationUserListQuery={}):Promise<AdministrationUserPage>{ const limit=query.limit ?? 25; const offset=query.offset ?? 0; return await (await request(`/api/users?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)).json() }, async create(input:CreateAdministrationUser):Promise<AdministrationUser>{ return await (await request('/api/users',{method:'POST',body:JSON.stringify(input)})).json() }, async changeRoles(id:string,roles:readonly AdministrationRole[]):Promise<AdministrationUser>{ return await (await request(`/api/users/${id}/roles`,{method:'PATCH',body:JSON.stringify({roles})})).json() }, async changeStatus(id:string,status:AdministrationStatus):Promise<AdministrationUser>{ return await (await request(`/api/users/${id}`,{method:'PATCH',body:JSON.stringify({status})})).json() }, async resetPassword(id:string,password:string):Promise<AdministrationUser>{ return await (await request(`/api/users/${id}/credentials`,{method:'PATCH',body:JSON.stringify({password})})).json() } } }
