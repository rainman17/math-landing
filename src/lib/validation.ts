// Правила проверки формы. Один и тот же код работает в браузере и на сервере,
// поэтому сообщения об ошибках совпадают, а сервер остаётся последней проверкой.
import { z } from 'zod'

import { GOAL_VALUES, PERSONAL_ROUTE_VALUES, SCHEDULE_VALUES, TIMEZONE_VALUES } from './options'

export type ContactType = 'phone' | 'telegram'
export type ParsedContact = { type: ContactType; value: string }

const TELEGRAM_USERNAME = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/

/** Распознаёт телефон или Telegram и приводит к единому виду: +79991234567 или @username. */
export function parseContact(raw: string): ParsedContact | null {
  const input = raw.trim()
  if (!input) return null

  const link = input.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([^/?#\s]+)\/?$/i)
  const telegramCandidate = link ? link[1] : input.startsWith('@') ? input.slice(1) : null
  if (telegramCandidate !== null) {
    return TELEGRAM_USERNAME.test(telegramCandidate)
      ? { type: 'telegram', value: `@${telegramCandidate}` }
      : null
  }

  if (/^[+\d\s().-]+$/.test(input)) {
    let digits = input.replace(/\D/g, '')
    if (!input.startsWith('+')) {
      if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
      else if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`
    }
    if (digits.length < 10 || digits.length > 15) return null
    if (digits.startsWith('7') && digits.length !== 11) return null
    return { type: 'phone', value: `+${digits}` }
  }

  if (TELEGRAM_USERNAME.test(input)) return { type: 'telegram', value: `@${input}` }
  return null
}

const optionalText = (max: number) => z.string().trim().max(max, `Не больше ${max} символов`).default('')

export const step1Schema = z.object({
  parentName: z
    .string({ required_error: 'Укажите, как к вам обращаться' })
    .trim()
    .min(2, 'Укажите, как к вам обращаться')
    .max(80, 'Не больше 80 символов'),
  contact: z
    .string({ required_error: 'Укажите телефон или Telegram' })
    .trim()
    .min(1, 'Укажите телефон или Telegram')
    .max(100, 'Слишком длинное значение')
    .refine((value) => parseContact(value) !== null, {
      message: 'Проверьте номер или ник: например, +7 999 123-45-67 или @username',
    }),
  email: z
    .string({ required_error: 'Укажите email' })
    .trim()
    .min(1, 'Укажите email')
    .max(254, 'Слишком длинный email')
    .email('Проверьте email: например, name@mail.ru'),
  grade: z.coerce
    .number({ invalid_type_error: 'Выберите класс ребёнка' })
    .int('Выберите класс ребёнка')
    .min(6, 'Выберите класс ребёнка')
    .max(10, 'Выберите класс ребёнка'),
  consentPersonalData: z.literal(true, {
    errorMap: () => ({ message: 'Отметьте согласие — без него мы не можем обработать заявку' }),
  }),
  consentMarketing: z.boolean().default(false),
  levelHint: z
    .string()
    .regex(/^[a-z0-9-]{0,40}$/)
    .optional()
    .transform((value) => value || undefined),
})
export type Step1Input = z.input<typeof step1Schema>
export type Step1Data = z.output<typeof step1Schema>

const shortString = z.string().trim().max(200).optional()

/** Служебные поля шага 1: защита от повторов и спама, источник перехода. */
export const step1MetaSchema = z.object({
  idempotencyKey: z.string().uuid(),
  website: z.string().max(200).optional(),
  elapsedMs: z.number().int().nonnegative(),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  attribution: z
    .object({
      utm: z
        .object({
          source: shortString,
          medium: shortString,
          campaign: shortString,
          term: shortString,
          content: shortString,
        })
        .partial()
        .optional(),
      referrer: z.string().trim().max(500).optional(),
      landingPage: z.string().trim().max(500).optional(),
    })
    .partial()
    .optional(),
})
export type Step1Meta = z.infer<typeof step1MetaSchema>

export const step2Schema = z
  .object({
    childName: optionalText(60),
    goal: z.enum(GOAL_VALUES, { errorMap: () => ({ message: 'Выберите главную цель' }) }),
    goalOther: optionalText(300),
    desiredResult: optionalText(1000),
    difficulties: optionalText(1000),
    schedule: z.array(z.enum(SCHEDULE_VALUES)).max(SCHEDULE_VALUES.length).default([]),
    scheduleComment: optionalText(300),
    timezone: z.enum(TIMEZONE_VALUES, { errorMap: () => ({ message: 'Выберите часовой пояс' }) }),
    personalRoute: z.enum(PERSONAL_ROUTE_VALUES).default('maybe'),
    waitlist: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.goal === 'other' && !data.goalOther) {
      ctx.addIssue({ code: 'custom', path: ['goalOther'], message: 'Опишите цель в паре слов' })
    }
    if (!data.waitlist && data.schedule.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['schedule'],
        message: 'Выберите хотя бы один вариант или отметьте, что подходящего времени нет',
      })
    }
  })
export type Step2Input = z.input<typeof step2Schema>
export type Step2Data = z.output<typeof step2Schema>

export type FieldErrors = Record<string, string>

/** Первое сообщение для каждого поля — его показываем рядом с полем. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!result[key]) result[key] = issue.message
  }
  return result
}
