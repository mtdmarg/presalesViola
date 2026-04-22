import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? ""
  if (hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY debe ser exactamente 32 bytes en hex (64 caracteres). Generá uno con: openssl rand -hex 32")
  }
  return Buffer.from(hex, "hex")
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12) // 96 bits — recomendado para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Formato: iv:authTag:datos (todo en base64, separado por ":")
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":")
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const parts = encoded.split(":")
  if (parts.length !== 3) throw new Error("Formato de token cifrado inválido")
  const [ivB64, authTagB64, encryptedB64] = parts
  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(authTagB64, "base64")
  const encrypted = Buffer.from(encryptedB64, "base64")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}

/** Devuelve null si el valor es null/vacío, o el valor descifrado.
 *  Si la key no coincide o el formato es inválido retorna null en lugar de lanzar. */
export function decryptOrNull(encoded: string | null | undefined): string | null {
  if (!encoded) return null
  try {
    return decrypt(encoded)
  } catch {
    console.error("[encryption] decryptOrNull falló — verificá que ENCRYPTION_KEY sea la misma con la que se encriptó el token")
    return null
  }
}
