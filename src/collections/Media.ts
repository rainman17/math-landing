import type { CollectionConfig } from 'payload'

import { anyone, canEditContent } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Изображения' },
  admin: { group: 'Контент' },
  access: {
    read: anyone,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Описание для незрячих (alt)',
      required: true,
    },
  ],
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [
      { name: 'card', width: 640, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'large', width: 1280, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
  },
}
