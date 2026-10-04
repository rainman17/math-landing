import Link from 'next/link'

import { TrackedLink } from '@/components/analytics/TrackedLink'
import { EVENTS } from '@/lib/analytics-events'
import { telegramHref } from '@/lib/format'

import { MobileMenu, type NavItem } from './MobileMenu'

export function Brand({ name }: { name: string }) {
  return (
    <Link href="/" className="brand" aria-label={`${name} — на главную`}>
      <span className="brand-mark" aria-hidden="true">
        Σ
      </span>
      <span className="brand-name">{name}</span>
    </Link>
  )
}

const LANDING_NAV: NavItem[] = [
  { href: '/#method', label: 'Программа' },
  { href: '/#levels', label: 'Уровни' },
  { href: '/#format', label: 'Формат' },
  { href: '/#faq', label: 'FAQ' },
]

export function Header({
  brandName,
  telegramUrl,
  telegramLabel,
  showTeachers = false,
  variant = 'landing',
}: {
  brandName: string
  telegramUrl?: string | null
  telegramLabel?: string | null
  showTeachers?: boolean
  variant?: 'landing' | 'minimal'
}) {
  const contactHref = telegramHref(telegramUrl)
  const nav = showTeachers ? [...LANDING_NAV, { href: '/#teachers', label: 'Для учителей' }] : LANDING_NAV

  if (variant === 'minimal') {
    return (
      <header className="site-header site-header--minimal">
        <div className="container header-inner">
          <Brand name={brandName} />
          <div className="header-actions">
            {contactHref && (
              <TrackedLink
                href={contactHref}
                external
                className="header-contact"
                event={EVENTS.contactClick}
                params={{ location: 'header' }}
              >
                Написать преподавателю
              </TrackedLink>
            )}
            <Link href="/" className="btn btn-ghost btn-sm">
              К программе
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand name={brandName} />
        <nav className="header-nav" aria-label="Разделы страницы">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          {contactHref && (
            <TrackedLink
              href={contactHref}
              external
              className="header-contact"
              event={EVENTS.contactClick}
              params={{ location: 'header' }}
            >
              Написать
            </TrackedLink>
          )}
          <TrackedLink
            href="/apply"
            className="btn btn-primary btn-sm header-cta"
            event={EVENTS.ctaClick}
            params={{ location: 'header', cta_type: 'apply' }}
          >
            Подобрать группу
          </TrackedLink>
          <MobileMenu
            items={nav}
            contactHref={contactHref}
            contactLabel={telegramLabel || 'Написать в Telegram'}
          />
        </div>
      </div>
    </header>
  )
}
