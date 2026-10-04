'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { track } from '@/components/analytics/track'
import { EVENTS } from '@/lib/analytics-events'
import {
  GOALS,
  PERSONAL_ROUTE,
  SCHEDULE,
  TIMEZONES,
  timezoneByOffset,
  type Goal,
  type PersonalRouteInterest,
  type ScheduleSlot,
  type TimezoneValue,
} from '@/lib/options'
import { fieldErrors, step2Schema, type FieldErrors } from '@/lib/validation'

import { CheckboxField, ChoiceGroup, FieldError, FormAlert, TextAreaField, TextField, focusFirstError } from './fields'

export type Step2Values = {
  childName: string
  goal?: Goal
  goalOther: string
  desiredResult: string
  difficulties: string
  schedule: ScheduleSlot[]
  scheduleComment: string
  timezone?: TimezoneValue
  personalRoute: PersonalRouteInterest
  waitlist: boolean
}

const DRAFT_KEY = 'mkm_step2_draft'
const FIELD_ORDER = ['goal', 'goalOther', 'schedule', 'timezone']

const EMPTY: Step2Values = {
  childName: '',
  goalOther: '',
  desiredResult: '',
  difficulties: '',
  schedule: [],
  scheduleComment: '',
  personalRoute: 'maybe',
  waitlist: false,
}

export function Step2Form({
  initial,
  levelHint,
  submitLabel,
}: {
  initial?: Partial<Step2Values>
  levelHint?: string | null
  submitLabel: string
}) {
  const router = useRouter()
  const [values, setValues] = useState<Step2Values>({ ...EMPTY, ...initial })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<{ message: string; restart?: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hydrated = useRef(false)

  // Восстанавливаем черновик (если вернулись назад или обновили страницу)
  // и подставляем часовой пояс устройства.
  useEffect(() => {
    let draft: Partial<Step2Values> = {}
    if (!initial) {
      try {
        draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')
      } catch {
        draft = {}
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- черновик живёт в localStorage, читаем после гидрации
    setValues((current) => ({
      ...current,
      ...draft,
      timezone: current.timezone ?? draft.timezone ?? timezoneByOffset(-new Date().getTimezoneOffset()),
    }))
    hydrated.current = true
  }, [initial])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    } catch {
      // черновик не критичен
    }
  }, [values])

  const set = <K extends keyof Step2Values>(key: K, value: Step2Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest)
    if (key === 'waitlist' && errors.schedule) setErrors(({ schedule: _removed, ...rest }) => rest)
  }

  const showErrors = (next: FieldErrors) => {
    setErrors(next)
    focusFirstError(next, FIELD_ORDER)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError(null)

    const parsed = step2Schema.safeParse(values)
    if (!parsed.success) return showErrors(fieldErrors(parsed.error))

    setSubmitting(true)
    try {
      const response = await fetch('/api/lead/step2', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const result = await response.json().catch(() => ({}))

      if (response.ok && result.ok) {
        track(EVENTS.formComplete, {
          level: levelHint ?? undefined,
          tariff: levelHint ?? undefined,
          goal: parsed.data.goal,
          schedule: parsed.data.schedule.join(','),
          personal_route: parsed.data.personalRoute,
          waitlist: parsed.data.waitlist,
        })
        try {
          window.localStorage.removeItem(DRAFT_KEY)
        } catch {
          // ignore
        }
        router.push(result.next ?? '/success')
        return
      }
      if (result.errors) showErrors(result.errors)
      else setFormError({ message: result.message ?? 'Не получилось отправить. Попробуйте ещё раз.', restart: response.status === 409 })
    } catch {
      setFormError({ message: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз — ответы остались в форме.' })
    }
    setSubmitting(false)
  }

  const goalIsOther = values.goal === 'other'

  return (
    <form className="form form--page" onSubmit={onSubmit} noValidate aria-busy={submitting}>
      <ChoiceGroup
        id="goal"
        legend="Главная цель занятий"
        required
        options={GOALS}
        value={values.goal}
        onChange={(goal) => set('goal', goal as Goal)}
        error={errors.goal}
      />
      <TextField
        id="goalOther"
        label={goalIsOther ? 'Опишите цель своими словами' : 'Хотите уточнить цель?'}
        required={goalIsOther}
        maxLength={300}
        value={values.goalOther}
        onChange={(event) => set('goalOther', event.target.value)}
        error={errors.goalOther}
      />
      <TextAreaField
        id="desiredResult"
        label="Какой результат будет для вас хорошим через 2–3 месяца?"
        maxLength={1000}
        placeholder="Например: понимает, откуда берутся формулы, и может объяснить решение своими словами"
        value={values.desiredResult}
        onChange={(event) => set('desiredResult', event.target.value)}
        error={errors.desiredResult}
      />
      <TextAreaField
        id="difficulties"
        label="Что сейчас даётся трудно?"
        maxLength={1000}
        value={values.difficulties}
        onChange={(event) => set('difficulties', event.target.value)}
        error={errors.difficulties}
      />
      <TextField
        id="childName"
        label="Имя или инициалы ребёнка"
        maxLength={60}
        autoComplete="off"
        value={values.childName}
        onChange={(event) => set('childName', event.target.value)}
        error={errors.childName}
      />

      <ChoiceGroup
        id="schedule"
        legend="Когда ребёнку удобно заниматься?"
        hint="Можно выбрать несколько вариантов. Точное время согласуем после подбора группы."
        required={!values.waitlist}
        multiple
        options={SCHEDULE}
        value={values.schedule}
        onChange={(schedule) => set('schedule', schedule as ScheduleSlot[])}
        error={errors.schedule}
      />
      <CheckboxField
        id="waitlist"
        checked={values.waitlist}
        onChange={(checked) => set('waitlist', checked)}
        label="Ни один вариант не подходит — добавьте в лист ожидания, напишем, когда появится подходящее время"
      />
      <TextField
        id="scheduleComment"
        label="Комментарий к расписанию"
        maxLength={300}
        placeholder="Например: по средам не можем, удобно после 17:00"
        value={values.scheduleComment}
        onChange={(event) => set('scheduleComment', event.target.value)}
        error={errors.scheduleComment}
      />
      <div className={`field${errors.timezone ? ' has-error' : ''}`}>
        <label htmlFor="timezone" className="field-label">
          Часовой пояс
          <span className="field-required" aria-hidden="true">
            {' '}
            *
          </span>
        </label>
        <select
          id="timezone"
          name="timezone"
          className="input select"
          value={values.timezone ?? ''}
          aria-invalid={errors.timezone ? true : undefined}
          aria-describedby={errors.timezone ? 'timezone-error' : undefined}
          onChange={(event) => set('timezone', event.target.value as TimezoneValue)}
        >
          <option value="" disabled>
            Выберите часовой пояс
          </option>
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <FieldError id="timezone" error={errors.timezone} />
      </div>

      <ChoiceGroup
        id="personalRoute"
        legend="Интересен «Персональный маршрут»?"
        hint="Две индивидуальные встречи за модуль, карта целей и подробный разбор ошибок. 1–2 места на группу."
        variant="segmented"
        options={PERSONAL_ROUTE}
        value={values.personalRoute}
        onChange={(value) => set('personalRoute', value as PersonalRouteInterest)}
      />

      <FormAlert>
        {formError && (
          <>
            {formError.message}{' '}
            {formError.restart && <Link href="/apply">Вернуться к шагу 1</Link>}
          </>
        )}
      </FormAlert>

      <div className="form-actions">
        <Link href="/apply" className="link-back">
          ← Назад к контактам
        </Link>
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? 'Отправляем…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
