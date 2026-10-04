import { describe, expect, it } from 'vitest'

import { fieldErrors, parseContact, step1Schema, step2Schema } from '@/lib/validation'

describe('parseContact', () => {
  it.each([
    ['+7 999 123-45-67', '+79991234567'],
    ['8 (999) 123-45-67', '+79991234567'],
    ['89991234567', '+79991234567'],
    ['9991234567', '+79991234567'],
    ['+380 50 123 45 67', '+380501234567'],
  ])('телефон %s → %s', (input, expected) => {
    expect(parseContact(input)).toEqual({ type: 'phone', value: expected })
  })

  it.each([
    ['@anna_parent', '@anna_parent'],
    ['anna_parent', '@anna_parent'],
    ['https://t.me/anna_parent', '@anna_parent'],
    ['t.me/anna_parent/', '@anna_parent'],
  ])('Telegram %s → %s', (input, expected) => {
    expect(parseContact(input)).toEqual({ type: 'telegram', value: expected })
  })

  it.each(['', '123', '+7 999 12', '+7 999 123 45 678', '@ab', '@1abcde', 'не контакт', 'name@mail.ru'])(
    'отклоняет «%s»',
    (input) => {
      expect(parseContact(input)).toBeNull()
    },
  )
})

const validStep1 = {
  parentName: 'Анна',
  contact: '@anna_parent',
  email: 'anna@mail.ru',
  grade: 7,
  consentPersonalData: true,
}

describe('step1Schema', () => {
  it('принимает корректный шаг 1', () => {
    const result = step1Schema.safeParse(validStep1)
    expect(result.success).toBe(true)
  })

  it('требует и телефон/Telegram, и email', () => {
    const result = step1Schema.safeParse({ ...validStep1, contact: '', email: '' })
    expect(result.success).toBe(false)
    const errors = fieldErrors(result.error!)
    expect(errors.contact).toBeTruthy()
    expect(errors.email).toBeTruthy()
  })

  it('без согласия заявка не проходит (A-08)', () => {
    const result = step1Schema.safeParse({ ...validStep1, consentPersonalData: false })
    expect(result.success).toBe(false)
    expect(fieldErrors(result.error!).consentPersonalData).toMatch(/согласие/)
  })

  it.each([5, 11, undefined])('класс %s вне диапазона 6–10 — ошибка', (grade) => {
    const result = step1Schema.safeParse({ ...validStep1, grade })
    expect(result.success).toBe(false)
    expect(fieldErrors(result.error!).grade).toBe('Выберите класс ребёнка')
  })

  it.each([6, 8, 9, 10])('класс %s допустим (A-15)', (grade) => {
    expect(step1Schema.safeParse({ ...validStep1, grade }).success).toBe(true)
  })

  it('пустой уровень превращается в undefined', () => {
    const result = step1Schema.parse({ ...validStep1, levelHint: '' })
    expect(result.levelHint).toBeUndefined()
  })
})

const validStep2 = {
  goal: 'understand',
  schedule: ['weekend'],
  timezone: 'Europe/Moscow',
}

describe('step2Schema', () => {
  it('принимает минимальный шаг 2 и подставляет значения по умолчанию', () => {
    const result = step2Schema.parse(validStep2)
    expect(result.personalRoute).toBe('maybe')
    expect(result.waitlist).toBe(false)
    expect(result.childName).toBe('')
  })

  it('цель «Другое» требует описания', () => {
    const result = step2Schema.safeParse({ ...validStep2, goal: 'other' })
    expect(result.success).toBe(false)
    expect(fieldErrors(result.error!).goalOther).toBeTruthy()
  })

  it('нужно выбрать время или лист ожидания', () => {
    const noTime = step2Schema.safeParse({ ...validStep2, schedule: [] })
    expect(noTime.success).toBe(false)
    expect(fieldErrors(noTime.error!).schedule).toBeTruthy()

    const waitlist = step2Schema.safeParse({ ...validStep2, schedule: [], waitlist: true })
    expect(waitlist.success).toBe(true)
  })

  it('отклоняет неизвестные значения справочников', () => {
    expect(step2Schema.safeParse({ ...validStep2, goal: 'hack' }).success).toBe(false)
    expect(step2Schema.safeParse({ ...validStep2, schedule: ['night'] }).success).toBe(false)
    expect(step2Schema.safeParse({ ...validStep2, timezone: 'Mars/Base' }).success).toBe(false)
  })

  it('ограничивает длину свободного текста', () => {
    const result = step2Schema.safeParse({ ...validStep2, desiredResult: 'а'.repeat(1001) })
    expect(result.success).toBe(false)
  })
})
