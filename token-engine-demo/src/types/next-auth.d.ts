import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      accountId: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    accountId: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string
  }
} 