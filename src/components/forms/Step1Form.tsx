'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { deviceType, readAttribution, sourceLabel, track } from '@/components/analytics/track'
import { EVENTS } from '@/lib/analytics-events'
import { GRADES } from '@/lib/options'
import { fieldErrors, step1Schema, type FieldErrors } from '@/lib/validation'

import { CheckboxField, ChoiceGroup, FormAlert, TextField, focusFirstError } from './fields'

export type Step1Initial = {
  parentName?: string
  contact?: string
  email?: string
  grade?: number
}

type Values = {
  parentName: string
  contact: string
  email: string
  grade?: number
  consentPersonalData: boolean
  consentMarketing: boolean
}

const FIELD_ORDER = ['parentName', 'contact', 'email', 'grade', 'consentPersonalData']

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      )

export function Step1Form({
  initial,
  levelHint,
  submitLabel,
  promise,
  variant = 'page',
  location,
}: {
  initial?: Step1Initial
  levelHint?: string
  submitLabel: string
  promise?: string | null
  variant?: 'page' | 'inline'
  location: 'apply' | 'final_cta'
}) {
  const router = useRouter()
  const prefix = variant === 'inline' ? 'final-' : ''
  const [values, setValues] = useState<Values>({
    parentName: initial?.parentName ?? '',
    contact: initial?.contact ?? '',
    email: initial?.email ?? '',
    grade: initial?.grade,
    consentPersonalData: false,
    consentMarketing: false,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const idempotencyKey = useRef<string>('')
  const startedAt = useRef<number>(0)

  useEffect(() => {
    idempotencyKey.current = newKey()
    startedAt.current = Date.now()
  }, [])

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest)
  }

  const showErrors = (next: FieldErrors) => {
    setErrors(next)
    focusFirstError(
      Object.fromEntries(Object.entries(next).map(([key, message]) => [`${prefix}${key}`, message])),
      FIELD_ORDER.map((key) => `${prefix}${key}`),
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError(null)

    const parsed = step1Schema.safeParse({ ...values, levelHint })
    if (!parsed.success) return showErrors(fieldErrors(parsed.error))

    setSubmitting(true)
    const attribution = readAttribution()
    try {
      const response = await fetch('/api/lead/step1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...values,
          levelHint,
          idempotencyKey: idempotencyKey.current,
          elapsedMs: Date.now() - startedAt.current,
          website: (document.getElementById(`${prefix}website`) as HTMLInputElement | null)?.value ?? '',
          device: deviceType(),
          attribution: { utm: attribution.utm, referrer: attribution.referrer, landingPage: attribution.landingPage },
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (response.ok && result.ok) {
        track(EVENTS.formStep1Submit, {
          class: values.grade,
          source: sourceLabel(attribution),
          utm: attribution.utm?.campaign || attribution.utm?.source,
          location,
          level: levelHint,
        })
        router.push(result.next ?? '/apply/details')
        return
      }
      if (result.errors) showErrors(result.errors)
      else setFormError(result.message ?? 'Не получилось отправить. Попробуйте ещё раз.')
    } catch {
      setFormError('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз — данные остались в форме.')
    }
    setSubmitting(false)
  }

  return (
    <form className={`form form--${variant}`} onSubmit={onSubmit} noValidate aria-busy={submitting}>
      <TextField
        id={`${prefix}parentName`}
        label="Как к вам обращаться?"
        required
        autoComplete="given-name"
        maxLength={80}
        value={values.parentName}
        onChange={(event) => set('parentName', event.target.value)}
        error={errors.parentName}
      />
      <div className="field-row">
        <TextField
          id={`${prefix}contact`}
          label="Телефон или Telegram"
          required
          autoComplete="tel"
          maxLength={100}
          placeholder="+7 999 123-45-67 или @username"
          value={values.contact}
          onChange={(event) => set('contact', event.target.value)}
          error={errors.contact}
        />
        <TextField
          id={`${prefix}email`}
          label="Email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          placeholder="name@mail.ru"
          value={values.email}
          onChange={(event) => set('email', event.target.value)}
          error={errors.email}
        />
      </div>
      <ChoiceGroup
        id={`${prefix}grade`}
        legend="Класс ребёнка"
        required
        variant="segmented"
        options={GRADES.map((grade) => ({ value: grade, label: String(grade) }))}
        value={values.grade}
        onChange={(grade) => set('grade', grade as number)}
        error={errors.grade}
      />

      {/* Ловушка для ботов: поле скрыто от людей и экранных читалок. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`${prefix}website`}>Сайт</label>
        <input id={`${prefix}website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <CheckboxField
        id={`${prefix}consentPersonalData`}
        required
        checked={values.consentPersonalData}
        onChange={(checked) => set('consentPersonalData', checked)}
        error={errors.consentPersonalData}
        label={
          <>
            Даю <Link href="/consent" target="_blank">согласие на обработку персональных данных</Link> и принимаю{' '}
            <Link href="/privacy" target="_blank">политику их обработки</Link>
          </>
        }
      />
      <CheckboxField
        id={`${prefix}consentMarketing`}
        checked={values.consentMarketing}
        onChange={(checked) => set('consentMarketing', checked)}
        label="Сообщать о новых наборах и материалах (можно отписаться в любой момент)"
      />

      <FormAlert>{formError}</FormAlert>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
        {submitting ? 'Сохраняем…' : submitLabel}
      </button>
      {promise && <p className="form-note">{promise}</p>}
    </form>
  )
}
