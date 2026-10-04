import type { CollectionConfig } from 'payload'

import { canEditContent, publishedOrStaff } from '../access'

export const FaqItems: CollectionConfig = {
  slug: 'faq',
  labels: { singular: 'Вопрос', plural: 'Частые вопросы' },
  defaultSort: 'sortOrder',
  admin: {
    group: 'Контент',
    useAsTitle: 'question',
    defaultColumns: ['question', 'published', 'sortOrder'],
  },
  access: {
    read: publishedOrStaff,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  fields: [
    { name: 'question', type: 'text', label: 'Вопрос', required: true },
    { name: 'answer', type: 'textarea', label: 'Ответ', required: true },
    { name: 'sortOrder', type: 'number', label: 'Порядок', defaultValue: 10, admin: { position: 'sidebar' } },
    { name: 'published', type: 'checkbox', label: 'Показывать на сайте', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
