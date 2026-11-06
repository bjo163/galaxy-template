// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const arsyApiUrl = process.env.ARSY_API_URL?.replace(/\/$/, '')

        if (!arsyApiUrl) {
          throw new Error('Arsy authentication is not configured. Set ARSY_API_URL.')
        }

        try {
          const response = await fetch(`${arsyApiUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })

          if (response.status === 401) {
            throw new Error('Email or password is incorrect.')
          }

          if (!response.ok) {
            throw new Error('The Arsy authentication service could not complete sign-in.')
          }

          const data = (await response.json()) as {
            account: { id: string; email: string; displayName: string }
            accessToken: string
          }

          return {
            id: data.account.id,
            email: data.account.email,
            name: data.account.displayName,
            arsyAccessToken: data.accessToken
          }
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Sign-in failed.')
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.arsyAccessToken = (user as typeof user & { arsyAccessToken: string }).arsyAccessToken
        token.sub = user.id
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.id = token.sub
        session.arsyAccessToken = token.arsyAccessToken
      }

      return session
    }
  }
}
