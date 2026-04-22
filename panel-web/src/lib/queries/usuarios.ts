import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { encrypt, decryptOrNull } from "@/lib/encryption"
import type { Usuario, UsuarioFormData } from "@/types/usuario"

const SELECT_FIELDS = `id, username, role, full_name, activa, access_token, chatwoot_id, created_at, updated_at`

function decryptRow(row: Usuario): Usuario {
  return { ...row, access_token: decryptOrNull(row.access_token) }
}

export async function getUsuarios(): Promise<Usuario[]> {
  const result = await query<Usuario>(
    `SELECT ${SELECT_FIELDS} FROM panel_users ORDER BY created_at DESC`
  )
  return result.rows.map(decryptRow)
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const result = await query<Usuario>(
    `SELECT ${SELECT_FIELDS} FROM panel_users WHERE id = $1`,
    [id]
  )
  const row = result.rows[0]
  return row ? decryptRow(row) : null
}

export async function createUsuario(data: UsuarioFormData & { password: string }): Promise<Usuario> {
  const hash = await bcrypt.hash(data.password, 12)
  const encryptedToken = data.access_token ? encrypt(data.access_token) : null
  const result = await query<Usuario>(
    `INSERT INTO panel_users (username, password_hash, role, full_name, activa, access_token, chatwoot_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${SELECT_FIELDS}`,
    [
      data.username,
      hash,
      data.role,
      data.full_name || null,
      data.activa,
      encryptedToken,
      data.chatwoot_id ?? null,
    ]
  )
  return decryptRow(result.rows[0])
}

export async function updateUsuario(
  id: string,
  data: Partial<UsuarioFormData>
): Promise<Usuario | null> {
  const fields: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (data.username !== undefined)     { fields.push(`username = $${idx++}`);     params.push(data.username) }
  if (data.full_name !== undefined)    { fields.push(`full_name = $${idx++}`);    params.push(data.full_name || null) }
  if (data.role !== undefined)         { fields.push(`role = $${idx++}`);         params.push(data.role) }
  if (data.activa !== undefined)       { fields.push(`activa = $${idx++}`);       params.push(data.activa) }
  if (data.access_token !== undefined) {
    fields.push(`access_token = $${idx++}`)
    params.push(data.access_token ? encrypt(data.access_token) : null)
  }
  if (data.chatwoot_id !== undefined)  { fields.push(`chatwoot_id = $${idx++}`);  params.push(data.chatwoot_id ?? null) }

  if (fields.length === 0) return null
  fields.push(`updated_at = NOW()`)
  params.push(id)

  const result = await query<Usuario>(
    `UPDATE panel_users SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING ${SELECT_FIELDS}`,
    params
  )
  const row = result.rows[0]
  return row ? decryptRow(row) : null
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12)
  await query(
    `UPDATE panel_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [hash, id]
  )
}

export async function deleteUsuario(
  id: string,
  currentUserId: string
): Promise<{ ok: boolean; error?: string }> {
  if (id === currentUserId) {
    return { ok: false, error: "No podés eliminar tu propio usuario" }
  }
  await query(`DELETE FROM panel_users WHERE id = $1`, [id])
  return { ok: true }
}
