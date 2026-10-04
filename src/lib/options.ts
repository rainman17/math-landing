// Справочники, общие для формы, сервера и админки.
// Значения (value) хранятся в базе и уходят в аналитику/CRM — не переименовывать без миграции.

export const GRADES = [6, 7, 8, 9, 10] as const

export const GOAL_VALUES = ['start', 'understand', 'olympiad', 'confidence', 'other'] as const
export type Goal = (typeof GOAL_VALUES)[number]

export const GOALS: { value: Goal; label: string; hint: string }[] = [
  { value: 'start', label: 'Спокойно начать алгебру', hint: 'разобраться с буквами, знаками и уравнениями' },
  { value: 'understand', label: 'Понять школьную алгебру', hint: 'связать правила со смыслом' },
  { value: 'olympiad', label: 'Нестандартные задачи и олимпиады', hint: 'задачи сложнее школьных' },
  { value: 'confidence', label: 'Повысить уверенность', hint: 'спокойно работать самостоятельно' },
  { value: 'other', label: 'Другое', hint: 'опишите своими словами' },
]

export const SCHEDULE_VALUES = ['weekday_afternoon', 'weekday_evening', 'weekend', 'flexible'] as const
export type ScheduleSlot = (typeof SCHEDULE_VALUES)[number]

export const SCHEDULE: { value: ScheduleSlot; label: string; hint: string }[] = [
  { value: 'weekday_afternoon', label: 'Будни после школы', hint: '15:00–18:00' },
  { value: 'weekday_evening', label: 'Будни вечером', hint: '18:00–21:00' },
  { value: 'weekend', label: 'Выходные', hint: '10:00–15:00' },
  { value: 'flexible', label: 'Гибко', hint: 'готовы обсудить варианты' },
]

// Россия не переходит на летнее время с 2014 года, поэтому смещение фиксированное.
export const TIMEZONE_VALUES = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Novosibirsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'other',
] as const
export type TimezoneValue = (typeof TIMEZONE_VALUES)[number]

export const TIMEZONES: { value: TimezoneValue; label: string; offsetMinutes: number | null }[] = [
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)', offsetMinutes: 120 },
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)', offsetMinutes: 180 },
  { value: 'Europe/Samara', label: 'Самара (UTC+4)', offsetMinutes: 240 },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)', offsetMinutes: 300 },
  { value: 'Asia/Omsk', label: 'Омск (UTC+6)', offsetMinutes: 360 },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск, Красноярск (UTC+7)', offsetMinutes: 420 },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)', offsetMinutes: 480 },
  { value: 'Asia/Yakutsk', label: 'Якутск, Чита (UTC+9)', offsetMinutes: 540 },
  { value: 'Asia/Vladivostok', label: 'Владивосток, Хабаровск (UTC+10)', offsetMinutes: 600 },
  { value: 'Asia/Magadan', label: 'Магадан, Сахалин (UTC+11)', offsetMinutes: 660 },
  { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)', offsetMinutes: 720 },
  { value: 'other', label: 'Другой часовой пояс', offsetMinutes: null },
]

export const PERSONAL_ROUTE_VALUES = ['yes', 'maybe', 'no'] as const
export type PersonalRouteInterest = (typeof PERSONAL_ROUTE_VALUES)[number]

export const PERSONAL_ROUTE: { value: PersonalRouteInterest; label: string }[] = [
  { value: 'yes', label: 'Интересно' },
  { value: 'maybe', label: 'Пока не знаю' },
  { value: 'no', label: 'Не нужно' },
]

export const APPLICATION_STATUSES = [
  { value: 'new', label: 'Новая' },
  { value: 'in_review', label: 'На рассмотрении' },
  { value: 'contacted', label: 'Связались' },
  { value: 'waitlist', label: 'Лист ожидания' },
  { value: 'enrolled', label: 'Записан(а) в группу' },
  { value: 'declined', label: 'Не актуально' },
]

export const APPLICATION_STAGES = [
  { value: 'step1', label: 'Только шаг 1 (контакт)' },
  { value: 'complete', label: 'Заполнена полностью' },
]

export const ENROLLMENT_STATUS_VALUES = ['open', 'few_left', 'waitlist', 'closed'] as const
export type EnrollmentStatus = (typeof ENROLLMENT_STATUS_VALUES)[number]

export const ENROLLMENT_STATUSES: { value: EnrollmentStatus; label: string }[] = [
  { value: 'open', label: 'Набор открыт' },
  { value: 'few_left', label: 'Осталось несколько мест' },
  { value: 'waitlist', label: 'Лист ожидания' },
  { value: 'closed', label: 'Набор закрыт' },
]

export const labelOf = <T extends string>(list: { value: T; label: string }[], value?: string | null) =>
  list.find((item) => item.value === value)?.label ?? value ?? ''

export const timezoneByOffset = (offsetMinutes: number): TimezoneValue =>
  TIMEZONES.find((tz) => tz.offsetMinutes === offsetMinutes)?.value ?? 'other'
