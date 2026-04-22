import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: "admin" | "viewer"
      full_name: string | null
      access_token: string | null
      chatwoot_id: number | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    username: string
    role: "admin" | "viewer"
    full_name: string | null
    access_token: string | null
    chatwoot_id: number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: "admin" | "viewer"
    full_name: string | null
    access_token: string | null
    chatwoot_id: number | null
  }
}
