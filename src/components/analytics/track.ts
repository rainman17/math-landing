import type { EventName, EventParams } from '@/lib/analytics-events'

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    __mkmYmId?: number
  }
}

export type Device = 'mobile' | 'tablet' | 'desktop'

export function deviceType(): Device {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1200) return 'tablet'
  return 'desktop'
}

/** Отправляет событие в Метрику (цель) и в dataLayer. Без контактов и свободного текста. */
export function track(event: EventName, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  )
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...clean })
  if (window.ym && window.__mkmYmId) window.ym(window.__mkmYmId, 'reachGoal', event, clean)
  if (process.env.NODE_ENV !== 'production') console.debug('[analytics]', event, clean)
}

// --- Источник перехода (UTM) ---

const ATTRIBUTION_KEY = 'mkm_attribution'
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const

export type Attribution = {
  utm?: Partial<Record<(typeof UTM_KEYS)[number], string>>
  referrer?: string
  landingPage?: string
  ts?: number
}

function readStorage(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Attribution
    if (!parsed.ts || Date.now() - parsed.ts > ATTRIBUTION_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Запоминает источник визита. Новый визит с UTM перезаписывает старый (последний рекламный
 * источник важнее для оценки кампаний); визит без UTM не затирает сохранённые метки.
 */
export function captureAttribution() {
  try {
    const url = new URL(window.location.href)
    const utm: Attribution['utm'] = {}
    for (const key of UTM_KEYS) {
      const value = url.searchParams.get(`utm_${key}`)
      if (value) utm[key] = value.slice(0, 200)
    }
    const hasUtm = Object.keys(utm).length > 0
    const stored = readStorage()
    if (!hasUtm && stored) return

    const referrer =
      document.referrer && new URL(document.referrer).host !== url.host ? document.referrer.slice(0, 500) : undefined
    const record: Attribution = {
      utm: hasUtm ? utm : {},
      referrer,
      landingPage: `${url.pathname}${url.search}`.slice(0, 500),
      ts: Date.now(),
    }
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(record))
  } catch {
    // localStorage может быть недоступен (приватный режим) — заявка уйдёт без UTM.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  return readStorage() ?? {}
}

/** Короткая метка источника для параметров аналитики. */
export function sourceLabel(attribution: Attribution = readAttribution()): string {
  if (attribution.utm?.source) return attribution.utm.source
  if (attribution.referrer) {
    try {
      return new URL(attribution.referrer).host
    } catch {
      return 'referral'
    }
  }
  return 'direct'
}
