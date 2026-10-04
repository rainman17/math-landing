import type { CollectionConfig } from 'payload'

import { canEditContent, publishedOrStaff } from '../access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Отзыв', plural: 'Отзывы' },
  defaultSort: 'sortOrder',
  admin: {
    group: 'Контент',
    useAsTitle: 'author',
    defaultColumns: ['author', 'consentConfirmed', 'published'],
    description: 'Отзывы и результаты публикуются только с согласия семьи.',
  },
  access: {
    read: publishedOrStaff,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  fields: [
    { name: 'author', type: 'text', label: 'Подпись', required: true, admin: { description: 'Например: «Мама ученика 7 класса»' } },
    { name: 'text', type: 'textarea', label: 'Текст отзыва', required: true },
    {
      name: 'consentConfirmed',
      type: 'checkbox',
      label: 'Есть согласие семьи на публикацию',
      admin: { position: 'sidebar' },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Показывать на сайте',
      defaultValue: false,
      admin: { position: 'sidebar' },
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        !value || siblingData?.consentConfirmed ? true : 'Сначала подтвердите согласие семьи на публикацию',
    },
    { name: 'sortOrder', type: 'number', label: 'Порядок', defaultValue: 10, admin: { position: 'sidebar' } },
  ],
}
