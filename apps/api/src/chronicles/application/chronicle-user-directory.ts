export const CHRONICLE_USER_DIRECTORY =
  Symbol('CHRONICLE_USER_DIRECTORY')

export interface ChronicleUserDirectoryEntry {
  readonly id: string
  readonly username: string
  readonly displayName: string
}

export interface ChronicleUserDirectory {
  list(): Promise<
    readonly ChronicleUserDirectoryEntry[]
  >
}
