export type AdministrationRole = 'admin' | 'narrator' | 'player'
export type AdministrationStatus = 'active' | 'disabled'
export interface AdministrationUser { readonly id:string; readonly username:string; readonly displayName:string; readonly status:AdministrationStatus; readonly roles:readonly AdministrationRole[]; readonly createdAt:string; readonly updatedAt:string }
export interface CreateAdministrationUser { readonly username:string; readonly displayName:string; readonly password:string; readonly roles:readonly AdministrationRole[] }

export interface AdministrationUserListQuery {
  readonly limit?: number
  readonly offset?: number
}

export interface AdministrationUserPage {
  readonly items:
    readonly AdministrationUser[]
  readonly nextOffset: number | null
}
