export const formatPrice = (value: number) =>
  `${new Intl.NumberFormat('ru-RU').format(value).replace(/ /g, ' ')} ₽`

export const pluralRu = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export const lessonsLabel = (count: number) => `${count} ${pluralRu(count, 'занятие', 'занятия', 'занятий')}`

export const telegramHref = (url?: string | null) => {
  if (!url) return null
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('@')) return `https://t.me/${trimmed.slice(1)}`
  return null
}
