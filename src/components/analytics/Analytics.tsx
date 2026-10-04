'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { EVENTS } from '@/lib/analytics-events'

import { captureAttribution, deviceType, sourceLabel, track } from './track'

const CONSENT_KEY = 'mkm_cookie_consent'
type Consent = 'unknown' | 'accepted' | 'declined'

function loadMetrika(counterId: number) {
  if (window.__mkmYmId) return
  window.__mkmYmId = counterId
  // Стандартный загрузчик Метрики: до загрузки tag.js вызовы ym() копятся в очереди.
  const queue = function (...args: unknown[]) {
    ;(queue as unknown as { a: unknown[] }).a.push(args)
  } as unknown as Window['ym'] & { a: unknown[]; l: number }
  queue.a = []
  queue.l = Date.now()
  window.ym = window.ym ?? queue
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://mc.yandex.ru/metrika/tag.js'
  document.head.appendChild(script)
  window.ym?.(counterId, 'init', {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  })
}

export function Analytics({
  counterId,
  requireConsent,
}: {
  counterId?: string | null
  requireConsent: boolean
}) {
  const pathname = usePathname()
  const [consent, setConsent] = useState<Consent>('unknown')
  const [ready, setReady] = useState(false)
  const previousUrl = useRef<string | null>(null)

  const id = counterId ? Number(counterId) : null
  const enabled = Boolean(id) && (!requireConsent || consent === 'accepted')

  // localStorage доступен только в браузере: читаем после гидрации, чтобы разметка
  // сервера и клиента совпадала.
  useEffect(() => {
    captureAttribution()
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(CONSENT_KEY)
    } catch {
      // без localStorage баннер будет показываться на каждой странице
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- однократная синхронизация с localStorage
    if (stored === 'accepted' || stored === 'declined') setConsent(stored)
    setReady(true)
  }, [])

  useEffect(() => {
    if (enabled && id) loadMetrika(id)
  }, [enabled, id])

  useEffect(() => {
    if (!enabled || !id) return
    const url = window.location.href
    window.ym?.(id, 'hit', url, { referer: previousUrl.current ?? document.referrer })
    previousUrl.current = url
    track(EVENTS.pageView, { page: pathname, device: deviceType(), source: sourceLabel() })
  }, [enabled, id, pathname])

  const choose = (value: Exclude<Consent, 'unknown'>) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value)
    } catch {
      // ignore
    }
    setConsent(value)
  }

  if (!ready || !id || !requireConsent || consent !== 'unknown') return null

  return (
    <div className="cookie-banner" role="region" aria-label="Использование cookie">
      <p>
        Мы используем cookie и Яндекс Метрику, чтобы понимать, как улучшить сайт.{' '}
        <Link href="/privacy">Подробнее</Link>
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => choose('accepted')}>
          Принять
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose('declined')}>
          Только необходимые
        </button>
      </div>
    </div>
  )
}
