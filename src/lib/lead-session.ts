import 'server-only'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import type { Payload } from 'payload'

import type { Application } from '../payload-types'

// Сессия заявки без личного кабинета: в cookie лежит случайный токен,
// в базе — только его хеш. Номер заявки наружу не отдаётся.
export const LEAD_COOKIE = 'mkm_lead'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export const newLeadToken = () => crypto.randomBytes(32).toString('base64url')
export const hashLeadToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export async function setLeadCookie(token: string) {
  const store = await cookies()
  store.set(LEAD_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function getLeadFromCookie(payload: Payload): Promise<Application | null> {
  const token = (await cookies()).get(LEAD_COOKIE)?.value
  if (!token || token.length > 100) return null
  const { docs } = await payload.find({
    collection: 'applications',
    where: { resumeTokenHash: { equals: hashLeadToken(token) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

/** Заполненную заявку можно поправить в течение суток, дальше — новая заявка. */
export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000

export const canEditCompleted = (lead: Application) =>
  lead.stage === 'complete' &&
  Boolean(lead.completedAt) &&
  Date.now() - new Date(lead.completedAt as string).getTime() < EDIT_WINDOW_MS
