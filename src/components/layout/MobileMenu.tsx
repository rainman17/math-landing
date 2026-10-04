'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { track } from '@/components/analytics/track'
import { EVENTS } from '@/lib/analytics-events'

export type NavItem = { href: string; label: string }

export function MobileMenu({
  items,
  contactHref,
  contactLabel,
}: {
  items: NavItem[]
  contactHref: string | null
  contactLabel: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('menu-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('menu-open')
    }
  }, [open])

  return (
    <div className="mobile-menu">
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-ghost btn-sm mobile-menu-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Закрыть' : 'Меню'}
      </button>
      <div id={panelId} className="mobile-menu-panel" hidden={!open}>
        <nav aria-label="Разделы страницы">
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="/apply"
          className="btn btn-primary btn-block"
          onClick={() => track(EVENTS.ctaClick, { location: 'mobile_menu', cta_type: 'apply' })}
        >
          Подобрать группу
        </a>
        {contactHref && (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-block"
            onClick={() => track(EVENTS.contactClick, { location: 'mobile_menu' })}
          >
            {contactLabel}
          </a>
        )}
      </div>
    </div>
  )
}
