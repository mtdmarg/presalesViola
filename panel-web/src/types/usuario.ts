export interface Usuario {
  id: string
  username: string
  role: "admin" | "viewer"
  full_name: string | null
  activa: boolean
  access_token: string | null
  chatwoot_id: number | null
  created_at: string
  updated_at: string
}

export interface UsuarioFormData {
  username: string
  full_name: string
  role: "admin" | "viewer"
  activa: boolean
  access_token?: string | null
  chatwoot_id?: number | null
  password?: string
}
