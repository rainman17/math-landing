import type { Field, GlobalConfig } from 'payload'

import { anyone, canEditContent } from '../access'

const MATH_HINT = 'Формулы оборачивайте в обратные кавычки: `2n + 1` — они будут набраны математическим шрифтом.'

const titleAndIntro = (introLabel = 'Подзаголовок'): Field[] => [
  { name: 'eyebrow', type: 'text', label: 'Надзаголовок' },
  { name: 'title', type: 'text', label: 'Заголовок', required: true },
  { name: 'intro', type: 'textarea', label: introLabel },
]

const cards = (name: string, label: string, extra: Field[] = [], maxRows?: number): Field => ({
  name,
  type: 'array',
  label,
  labels: { singular: 'Пункт', plural: 'Пункты' },
  maxRows,
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    { name: 'text', type: 'textarea', label: 'Текст' },
    ...extra,
  ],
})

const lines = (name: string, label: string): Field => ({
  name,
  type: 'array',
  label,
  labels: { singular: 'Строка', plural: 'Строки' },
  fields: [{ name: 'text', type: 'text', label: 'Текст', required: true }],
})

export const Landing: GlobalConfig = {
  slug: 'landing',
  label: 'Главная страница',
  admin: {
    group: 'Контент',
    description: 'Тексты блоков главной. Уровни, цены, FAQ и отзывы — в отдельных разделах.',
  },
  access: { read: anyone, update: canEditContent },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Первый экран',
          name: 'hero',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Надзаголовок' },
            { name: 'title', type: 'textarea', label: 'Заголовок H1', required: true },
            { name: 'subtitle', type: 'textarea', label: 'Подзаголовок', required: true },
            {
              type: 'row',
              fields: [
                { name: 'primaryCta', type: 'text', label: 'Основная кнопка', required: true },
                { name: 'secondaryCta', type: 'text', label: 'Кнопка теста', admin: { description: 'Видна, только если тест включён в настройках' } },
              ],
            },
            lines('facts', 'Факты под кнопками'),
            {
              name: 'visual',
              type: 'group',
              label: 'Карточка «Математическая мастерская»',
              fields: [
                { name: 'eyebrow', type: 'text', label: 'Надзаголовок' },
                { name: 'title', type: 'text', label: 'Заголовок' },
                { name: 'text', type: 'textarea', label: 'Текст' },
              ],
            },
          ],
        },
        {
          label: 'Узнавание',
          name: 'problems',
          fields: [...titleAndIntro(), cards('items', 'Ситуации', [], 6)],
        },
        {
          label: 'Методика',
          name: 'method',
          fields: [
            ...titleAndIntro(),
            cards('steps', 'Шаги', [
              { name: 'example', type: 'text', label: 'Пример', admin: { description: MATH_HINT } },
            ]),
          ],
        },
        {
          label: 'Уровни',
          name: 'levels',
          fields: [...titleAndIntro(), lines('notes', 'Пояснения под карточками')],
        },
        {
          label: 'Формат',
          name: 'format',
          fields: [...titleAndIntro(), lines('facts', 'Короткие факты'), cards('steps', 'Как проходит модуль')],
        },
        {
          label: 'Преподаватель',
          name: 'teacher',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Надзаголовок' },
            { name: 'name', type: 'text', label: 'Имя и фамилия', required: true },
            { name: 'role', type: 'text', label: 'Кратко, кто это' },
            { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография' },
            { name: 'bio', type: 'textarea', label: 'Короткая биография' },
            lines('facts', 'Опыт — коротко'),
            { name: 'quote', type: 'textarea', label: 'Обращение к родителям' },
          ],
        },
        {
          label: 'Персональный маршрут',
          name: 'personalRoute',
          fields: [
            ...titleAndIntro(),
            lines('included', 'Входит в базовый тариф'),
            lines('added', 'Добавляется в Персональный маршрут'),
            { name: 'limitNote', type: 'text', label: 'Ограничение мест' },
          ],
        },
        {
          label: 'Для учителей',
          name: 'community',
          fields: [
            ...titleAndIntro('Текст'),
            lines('points', 'Что внутри'),
            { name: 'cta', type: 'text', label: 'Кнопка', required: true },
          ],
        },
        {
          label: 'Как попасть в группу',
          name: 'howToJoin',
          fields: [...titleAndIntro(), cards('steps', 'Шаги', [], 6)],
        },
        {
          label: 'Доверие',
          name: 'trust',
          fields: [...titleAndIntro(), cards('facts', 'Факты о формате', [], 6)],
        },
        {
          label: 'FAQ',
          name: 'faq',
          fields: titleAndIntro(),
        },
        {
          label: 'Финальный призыв',
          name: 'finalCta',
          fields: [
            { name: 'title', type: 'text', label: 'Заголовок', required: true },
            { name: 'text', type: 'textarea', label: 'Текст' },
          ],
        },
      ],
    },
  ],
}
