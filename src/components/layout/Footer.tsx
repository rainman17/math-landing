import Link from 'next/link'

import { TrackedLink } from '@/components/analytics/TrackedLink'
import { EVENTS } from '@/lib/analytics-events'
import { telegramHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

const LEGAL_LABELS: Record<string, string> = {
  privacy: 'Политика обработки персональных данных',
  consent: 'Согласие на обработку данных',
  offer: 'Оферта',
}

export function Footer({ settings, legalSlugs }: { settings: SiteSetting; legalSlugs: string[] }) {
  const contactHref = telegramHref(settings.telegramUrl)
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="footer-title">{settings.brandName}</p>
          <p className="footer-text">
            {settings.courseName} — онлайн-курс алгебры для 6–8 классов и олимпиадная траектория для 6–10 классов.
          </p>
        </div>

        <div>
          <p className="footer-heading">Связаться</p>
          <ul className="footer-list">
            {contactHref && (
              <li>
                <TrackedLink
                  href={contactHref}
                  external
                  event={EVENTS.contactClick}
                  params={{ location: 'footer' }}
                >
                  {settings.telegramLabel || 'Telegram'}
                </TrackedLink>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            )}
            {settings.phone && (
              <li>
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`}>{settings.phone}</a>
              </li>
            )}
            <li>
              <Link href="/apply">Оставить заявку</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="footer-heading">Документы</p>
          <ul className="footer-list">
            {['privacy', 'consent', 'offer']
              .filter((slug) => legalSlugs.includes(slug))
              .map((slug) => (
                <li key={slug}>
                  <Link href={`/${slug}`}>{LEGAL_LABELS[slug]}</Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>
          © {year} {settings.brandName}
        </p>
        {settings.operatorDetails && <p className="footer-operator">{settings.operatorDetails}</p>}
      </div>
    </footer>
  )
}
