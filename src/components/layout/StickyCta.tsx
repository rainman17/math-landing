'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { track } from '@/components/analytics/track'
import { EVENTS } from '@/lib/analytics-events'

/**
 * Кнопка «Подобрать группу», закреплённая внизу экрана на телефоне.
 * Появляется после первого экрана и прячется, когда виден финальный блок с формой.
 */
export function StickyCta({ label }: { label: string }) {
  const [pastHero, setPastHero] = useState(false)
  const [finalVisible, setFinalVisible] = useState(false)

  useEffect(() => {
    const heroEnd = document.getElementById('hero-end')
    const finalCta = document.getElementById('final-cta')
    const observers: IntersectionObserver[] = []

    if (heroEnd) {
      const observer = new IntersectionObserver(([entry]) =>
        setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      )
      observer.observe(heroEnd)
      observers.push(observer)
    }
    if (finalCta) {
      const observer = new IntersectionObserver(([entry]) => setFinalVisible(entry.isIntersecting), {
        threshold: 0.15,
      })
      observer.observe(finalCta)
      observers.push(observer)
    }
    return () => observers.forEach((observer) => observer.disconnect())
  }, [])

  const visible = pastHero && !finalVisible

  return (
    <div className={`sticky-cta${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <Link
        href="/apply"
        className="btn btn-primary btn-block btn-lg"
        tabIndex={visible ? 0 : -1}
        onClick={() => track(EVENTS.ctaClick, { location: 'sticky_mobile', cta_type: 'apply' })}
      >
        {label}
      </Link>
    </div>
  )
}
