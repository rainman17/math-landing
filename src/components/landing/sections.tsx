import Image from 'next/image'
import type { ReactNode } from 'react'

import { TrackedLink } from '@/components/analytics/TrackedLink'
import { Step1Form } from '@/components/forms/Step1Form'
import { EVENTS } from '@/lib/analytics-events'
import { formatPrice, lessonsLabel, telegramHref } from '@/lib/format'
import { ENROLLMENT_STATUSES, labelOf } from '@/lib/options'
import type { Faq as FaqItem, Landing, Level, Media, SiteSetting, Testimonial } from '@/payload-types'

import { HeroVisual } from './HeroVisual'
import { MathText } from './MathText'

type SectionProps = {
  id: string
  eyebrow?: string | null
  title: string
  intro?: string | null
  tone?: 'default' | 'alt' | 'accent' | 'dark'
  children: ReactNode
  className?: string
}

function Section({ id, eyebrow, title, intro, tone = 'default', children, className = '' }: SectionProps) {
  return (
    <section id={id} className={`section section--${tone} ${className}`} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section-head">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={`${id}-title`} className="section-title">
            {title}
          </h2>
          {intro && <p className="section-intro">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}

// 2. Первый экран
export function Hero({ hero, showTestCta }: { hero: Landing['hero']; showTestCta: boolean }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <h1 id="hero-title" className="hero-title">
            {hero.title}
          </h1>
          <p className="hero-subtitle">{hero.subtitle}</p>
          <div className="hero-actions">
            <TrackedLink
              href="/apply"
              className="btn btn-primary btn-lg"
              event={EVENTS.ctaClick}
              params={{ location: 'hero', cta_type: 'apply' }}
            >
              {hero.primaryCta}
            </TrackedLink>
            {showTestCta && hero.secondaryCta && (
              <TrackedLink
                href="/test"
                className="btn btn-secondary btn-lg"
                event={EVENTS.ctaClick}
                params={{ location: 'hero', cta_type: 'test' }}
              >
                {hero.secondaryCta}
              </TrackedLink>
            )}
          </div>
          {hero.facts && hero.facts.length > 0 && (
            <ul className="hero-facts">
              {hero.facts.map((fact) => (
                <li key={fact.id ?? fact.text}>{fact.text}</li>
              ))}
            </ul>
          )}
        </div>
        <HeroVisual visual={hero.visual} />
      </div>
    </section>
  )
}

// 3. Узнавание проблемы
export function Problems({ data }: { data: Landing['problems'] }) {
  return (
    <Section id="problems" eyebrow={data.eyebrow} title={data.title} intro={data.intro}>
      <ul className="problem-grid">
        {data.items?.map((item) => (
          <li key={item.id ?? item.title} className="problem-card">
            <p className="problem-quote">«{item.title}»</p>
            {item.text && <p className="problem-text">{item.text}</p>}
          </li>
        ))}
      </ul>
    </Section>
  )
}

// 4. Методика
export function Method({ data }: { data: Landing['method'] }) {
  return (
    <Section id="method" eyebrow={data.eyebrow} title={data.title} intro={data.intro} tone="alt">
      <ol className="method-steps">
        {data.steps?.map((step, index) => (
          <li key={step.id ?? step.title} className="method-step">
            <span className="method-num" aria-hidden="true">
              {index + 1}
            </span>
            <h3 className="method-title">{step.title}</h3>
            {step.text && <p className="method-text">{step.text}</p>}
            {step.example && (
              <p className="method-example">
                <span className="visually-hidden">Пример: </span>
                <MathText text={step.example} />
              </p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  )
}

// 5. Уровни
export function Levels({ data, levels }: { data: Landing['levels']; levels: Level[] }) {
  return (
    <Section id="levels" eyebrow={data.eyebrow} title={data.title} intro={data.intro}>
      <div className="level-grid">
        {levels.map((level) => {
          const waitlistOnly = level.enrollmentStatus === 'closed' || level.enrollmentStatus === 'waitlist'
          return (
            <article key={level.id} className={`level-card${level.highlighted ? ' is-highlighted' : ''}`}>
              <div className="level-top">
                {level.badge && <span className="chip">{level.badge}</span>}
                <span className="level-grades">{level.grades}</span>
              </div>
              <h3 className="level-title">{level.title}</h3>
              <dl className="level-details">
                <div>
                  <dt>Кому подходит</dt>
                  <dd>{level.forWhom}</dd>
                </div>
                <div>
                  <dt>На занятиях</dt>
                  <dd>{level.whatHappens}</dd>
                </div>
                <div>
                  <dt>Результат</dt>
                  <dd>{level.outcome}</dd>
                </div>
              </dl>
              <div className="level-bottom">
                <p className="level-meta">
                  {lessonsLabel(level.lessonsCount)} × {level.lessonMinutes} мин · {level.durationLabel}
                </p>
                <p className="level-price">
                  <strong>{formatPrice(level.price)}</strong> <span>за модуль</span>
                </p>
                {level.installmentNote && <p className="level-installment">{level.installmentNote}</p>}
                <p className={`status status--${level.enrollmentStatus}`}>
                  {labelOf(ENROLLMENT_STATUSES, level.enrollmentStatus)}
                  {level.nextStart ? ` · ${level.nextStart}` : ''}
                </p>
                <TrackedLink
                  href={`/apply?level=${level.slug}`}
                  className={`btn btn-block ${level.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                  event={EVENTS.ctaClick}
                  params={{ location: 'levels', cta_type: waitlistOnly ? 'waitlist' : 'apply', level: level.slug }}
                >
                  {waitlistOnly ? 'Встать в лист ожидания' : level.ctaLabel || 'Подобрать группу'}
                </TrackedLink>
              </div>
            </article>
          )
        })}
      </div>
      {data.notes && data.notes.length > 0 && (
        <ul className="level-notes">
          {data.notes.map((note) => (
            <li key={note.id ?? note.text}>{note.text}</li>
          ))}
        </ul>
      )}
    </Section>
  )
}

// 6. Что происходит на курсе
export function Format({ data }: { data: Landing['format'] }) {
  return (
    <Section id="format" eyebrow={data.eyebrow} title={data.title} intro={data.intro} tone="alt">
      {data.facts && data.facts.length > 0 && (
        <ul className="fact-chips">
          {data.facts.map((fact) => (
            <li key={fact.id ?? fact.text} className="chip chip--lg">
              {fact.text}
            </li>
          ))}
        </ul>
      )}
      <ol className="timeline">
        {data.steps?.map((step, index) => (
          <li key={step.id ?? step.title} className="timeline-item">
            <span className="timeline-num" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h3 className="timeline-title">{step.title}</h3>
              {step.text && <p className="timeline-text">{step.text}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

const initials = (name?: string | null) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

// 7. Преподаватель
export function Teacher({ data }: { data: Landing['teacher'] }) {
  const photo = typeof data.photo === 'object' && data.photo ? (data.photo as Media) : null
  const photoUrl = photo?.sizes?.card?.url || photo?.url
  return (
    <section id="teacher" className="section section--default" aria-labelledby="teacher-title">
      <div className="container teacher-grid">
        <div className="teacher-photo">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={photo?.alt || data.name}
              width={photo?.sizes?.card?.width || photo?.width || 640}
              height={photo?.sizes?.card?.height || photo?.height || 800}
              sizes="(min-width: 900px) 380px, 100vw"
            />
          ) : (
            <div className="teacher-placeholder" aria-hidden="true">
              {initials(data.name)}
            </div>
          )}
        </div>
        <div className="teacher-copy">
          {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
          <h2 id="teacher-title" className="section-title">
            {data.name}
          </h2>
          {data.role && <p className="teacher-role">{data.role}</p>}
          {data.bio && <p className="teacher-bio">{data.bio}</p>}
          {data.facts && data.facts.length > 0 && (
            <ul className="check-list">
              {data.facts.map((fact) => (
                <li key={fact.id ?? fact.text}>{fact.text}</li>
              ))}
            </ul>
          )}
          {data.quote && (
            <blockquote className="teacher-quote">
              <p>{data.quote}</p>
            </blockquote>
          )}
        </div>
      </div>
    </section>
  )
}

// 8. Персональный маршрут
export function PersonalRoute({ data, levels }: { data: Landing['personalRoute']; levels: Level[] }) {
  const priced = levels.filter((level) => level.personalRouteSurcharge)
  return (
    <Section id="personal-route" eyebrow={data.eyebrow} title={data.title} intro={data.intro} tone="accent">
      <div className="compare">
        <div className="compare-col">
          <h3 className="compare-title">Входит в базовый тариф</h3>
          <ul className="check-list">
            {data.included?.map((item) => (
              <li key={item.id ?? item.text}>{item.text}</li>
            ))}
          </ul>
        </div>
        <div className="compare-col compare-col--plus">
          <h3 className="compare-title">Добавляется в Персональный маршрут</h3>
          <ul className="check-list check-list--plus">
            {data.added?.map((item) => (
              <li key={item.id ?? item.text}>{item.text}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="route-footer">
        {priced.length > 0 && (
          <dl className="route-prices">
            {priced.map((level) => (
              <div key={level.id}>
                <dt>{level.title}</dt>
                <dd>{level.personalRouteSurcharge}</dd>
              </div>
            ))}
          </dl>
        )}
        {data.limitNote && <p className="route-limit">{data.limitNote}</p>}
        <TrackedLink
          href="/apply"
          className="btn btn-secondary"
          event={EVENTS.ctaClick}
          params={{ location: 'personal_route', cta_type: 'apply' }}
        >
          Отметить интерес в заявке
        </TrackedLink>
      </div>
    </Section>
  )
}

// 9. Для учителей (включается в настройках после запуска формы комьюнити)
export function Community({ data }: { data: Landing['community'] }) {
  return (
    <section id="teachers" className="section section--default" aria-labelledby="teachers-title">
      <div className="container">
        <div className="community-card">
          <div>
            {data.eyebrow && <p className="eyebrow eyebrow--light">{data.eyebrow}</p>}
            <h2 id="teachers-title" className="section-title">
              {data.title}
            </h2>
            {data.intro && <p className="community-text">{data.intro}</p>}
            <TrackedLink
              href="/teachers/apply"
              className="btn btn-light"
              event={EVENTS.communityCtaClick}
              params={{ location: 'landing' }}
            >
              {data.cta}
            </TrackedLink>
          </div>
          {data.points && data.points.length > 0 && (
            <ul className="check-list check-list--light">
              {data.points.map((point) => (
                <li key={point.id ?? point.text}>{point.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

// 10. Как попасть в группу
export function HowToJoin({ data }: { data: Landing['howToJoin'] }) {
  return (
    <Section id="how-to-join" eyebrow={data.eyebrow} title={data.title} intro={data.intro} tone="alt">
      <ol className="join-steps">
        {data.steps?.map((step, index) => (
          <li key={step.id ?? step.title} className="join-step">
            <span className="join-num" aria-hidden="true">
              {index + 1}
            </span>
            <h3 className="join-title">{step.title}</h3>
            {step.text && <p className="join-text">{step.text}</p>}
          </li>
        ))}
      </ol>
    </Section>
  )
}

// 11. Доверие
export function Trust({ data, testimonials }: { data: Landing['trust']; testimonials: Testimonial[] }) {
  return (
    <Section id="trust" eyebrow={data.eyebrow} title={data.title} intro={data.intro}>
      <ul className="trust-grid">
        {data.facts?.map((fact) => (
          <li key={fact.id ?? fact.title} className="trust-card">
            <h3 className="trust-title">{fact.title}</h3>
            {fact.text && <p className="trust-text">{fact.text}</p>}
          </li>
        ))}
      </ul>
      {testimonials.length > 0 && (
        <div className="testimonials">
          {testimonials.map((item) => (
            <figure key={item.id} className="testimonial">
              <blockquote>
                <p>{item.text}</p>
              </blockquote>
              <figcaption>{item.author}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  )
}

// 12. FAQ
export function Faq({ data, items }: { data: Landing['faq']; items: FaqItem[] }) {
  return (
    <Section id="faq" eyebrow={data.eyebrow} title={data.title} intro={data.intro} tone="alt">
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.id} className="faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}

// 13. Финальный призыв с короткой формой (шаг 1 заявки)
export function FinalCta({
  data,
  settings,
  submitLabel,
}: {
  data: Landing['finalCta']
  settings: SiteSetting
  submitLabel: string
}) {
  const contactHref = telegramHref(settings.telegramUrl)
  return (
    <section id="final-cta" className="final-cta" aria-labelledby="final-cta-title">
      <div className="container final-grid">
        <div className="final-copy">
          <h2 id="final-cta-title" className="section-title">
            {data.title}
          </h2>
          {data.text && <p className="final-text">{data.text}</p>}
          {contactHref && (
            <p className="final-contact">
              Сначала хотите задать вопрос?{' '}
              <TrackedLink
                href={contactHref}
                external
                event={EVENTS.contactClick}
                params={{ location: 'final_cta' }}
              >
                Напишите преподавателю
              </TrackedLink>
            </p>
          )}
        </div>
        <div className="final-form card">
          <Step1Form variant="inline" location="final_cta" submitLabel={submitLabel} />
        </div>
      </div>
    </section>
  )
}
