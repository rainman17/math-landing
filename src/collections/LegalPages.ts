import type { CollectionConfig } from 'payload'

import { anyone, canEditContent } from '../access'

export const LEGAL_SLUGS = ['privacy', 'consent', 'offer'] as const
export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export const LegalPages: CollectionConfig = {
  slug: 'legal-pages',
  labels: { singular: 'Юридический документ', plural: 'Юридические документы' },
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'version', 'isDraft'],
    description:
      'Тексты размещаются только после согласования с владельцем проекта и юристом. Разработчик их не придумывает.',
  },
  access: {
    read: anyone,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  fields: [
    {
      name: 'slug',
      type: 'select',
      label: 'Страница',
      required: true,
      unique: true,
      options: [
        { label: 'Политика обработки персональных данных — /privacy', value: 'privacy' },
        { label: 'Согласие на обработку персональных данных — /consent', value: 'consent' },
        { label: 'Оферта — /offer', value: 'offer' },
      ],
    },
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    {
      type: 'row',
      fields: [
        { name: 'version', type: 'text', label: 'Версия', required: true, admin: { description: 'Например: 1.0 от 01.11.2026' } },
        { name: 'effectiveDate', type: 'date', label: 'Действует с' },
      ],
    },
    { name: 'content', type: 'richText', label: 'Текст документа', required: true },
    {
      name: 'isDraft',
      type: 'checkbox',
      label: 'Черновик — не согласован',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Пока отмечено, на странице виден баннер «Документ на согласовании».',
      },
    },
  ],
}
