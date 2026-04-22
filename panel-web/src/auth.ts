import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Pool } from "pg"
import { decryptOrNull } from "@/lib/encryption"

// Pool de DB exclusivo para auth (no usa el singleton de lib/db.ts para
// evitar dependencias del Edge Runtime en middleware)
const authPool = new Pool({ connectionString: process.env.DATABASE_URL })

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const result = await authPool.query(
          `SELECT id, username, password_hash, role, full_name, access_token, chatwoot_id
           FROM panel_users
           WHERE username = $1 AND activa = true`,
          [credentials.username]
        )

        const user = result.rows[0]
        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        )
        if (!passwordMatch) return null

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
          access_token: decryptOrNull(user.access_token),
          chatwoot_id: user.chatwoot_id ?? null,
          name: user.full_name,
          email: null,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string
          username: string
          role: "admin" | "viewer"
          full_name: string | null
          access_token: string | null
          chatwoot_id: number | null
        }
        token.id = u.id
        token.username = u.username
        token.role = u.role
        token.full_name = u.full_name
        token.access_token = u.access_token
        token.chatwoot_id = u.chatwoot_id
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.role = token.role as "admin" | "viewer"
      session.user.full_name = token.full_name as string | null
      session.user.access_token = token.access_token as string | null
      session.user.chatwoot_id = token.chatwoot_id as number | null
      return session
    },
  },
  trustHost: true,
})
