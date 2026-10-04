import type { Metadata } from 'next'
import Link from 'next/link'

import { TrackedLink } from '@/components/analytics/TrackedLink'
import { Header } from '@/components/layout/Header'
import { EVENTS } from '@/lib/analytics-events'
import { telegramHref } from '@/lib/format'
import { canEditCompleted, getLeadFromCookie } from '@/lib/lead-session'
import { GOALS, SCHEDULE, labelOf } from '@/lib/options'
import { getApplyForm, getLevels, getPayloadClient, getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Заявка получена',
  robots: { index: false, follow: false },
}

export default async function SuccessPage() {
  const payload = await getPayloadClient()
  const [settings, applyForm, levels, lead] = await Promise.all([
    getSiteSettings(),
    getApplyForm(),
    getLevels(),
    getLeadFromCookie(payload),
  ])
  const success = applyForm.success
  const contactHref = telegramHref(settings.telegramUrl)
  const complete = lead?.stage === 'complete'
  const level = levels.find((item) => item.slug === lead?.levelHint)

  const summary = complete
    ? [
        { label: 'Имя', value: lead.parentName },
        { label: 'Класс', value: `${lead.grade} класс` },
        level && { label: 'Интересующий уровень', value: level.title },
        { label: 'Цель', value: lead.goal === 'other' ? lead.goalOther : labelOf(GOALS, lead.goal) },
        {
          label: 'Удобное время',
          value: lead.waitlist
            ? 'Лист ожидания'
            : (lead.schedule ?? []).map((slot) => labelOf(SCHEDULE, slot)).join(', '),
        },
        { label: 'Контакт', value: `${lead.contact} · ${lead.email}` },
      ].filter((row): row is { label: string; value: string } => Boolean(row && row.value))
    : []

  return (
    <>
      <Header
        variant="minimal"
        brandName={settings.brandName}
        telegramUrl={settings.telegramUrl}
        telegramLabel={settings.telegramLabel}
      />
      <main id="main" className="apply-page">
        <div className="container success-grid">
          <div className="card success-card">
            <span className="success-icon" aria-hidden="true">
              ✓
            </span>
            <h1 className="apply-title">{success.heading}</h1>
            {success.subheading && <p className="apply-lead">{success.subheading}</p>}

            {summary.length > 0 && (
              <div className="summary">
                <p className="eyebrow">Мы получили</p>
                <dl>
                  {summary.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {complete && lead.waitlist && success.waitlistText && <p className="notice">{success.waitlistText}</p>}
            {success.nextText && <p className="success-next">{success.nextText}</p>}
            {settings.responseTime && (
              <p className="success-time">
                <strong>Срок ответа:</strong> {settings.responseTime}
              </p>
            )}

            {success.contactPrompt && contactHref && <p className="success-prompt">{success.contactPrompt}</p>}
            <div className="success-actions">
              {contactHref && (
                <TrackedLink
                  href={contactHref}
                  external
                  className="btn btn-primary"
                  event={EVENTS.contactClick}
                  params={{ location: 'success' }}
                >
                  {settings.telegramLabel || 'Написать в Telegram'}
                </TrackedLink>
              )}
              <Link href="/" className="btn btn-secondary">
                Вернуться к программе
              </Link>
            </div>
            {!contactHref && settings.email && (
              <p className="success-prompt">
                Вопросы можно задать по почте: <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
            )}
            {complete && canEditCompleted(lead) && (
              <p className="form-note">
                Ошиблись в ответах? <Link href="/apply/details">Исправить заявку</Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
