import type { GlobalConfig } from 'payload'

import { anyone, canEditContent } from '../access'

export const ApplyForm: GlobalConfig = {
  slug: 'apply-form',
  label: 'Тексты формы заявки',
  admin: { group: 'Контент' },
  access: { read: anyone, update: canEditContent },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Шаг 1',
          name: 'step1',
          fields: [
            { name: 'heading', type: 'text', label: 'Заголовок', required: true },
            { name: 'lead', type: 'textarea', label: 'Подзаголовок' },
            { name: 'promise', type: 'text', label: 'Подсказка под формой' },
            { name: 'submitLabel', type: 'text', label: 'Кнопка', required: true },
          ],
        },
        {
          label: 'Шаг 2',
          name: 'step2',
          fields: [
            { name: 'heading', type: 'text', label: 'Заголовок', required: true },
            { name: 'lead', type: 'textarea', label: 'Подзаголовок' },
            { name: 'submitLabel', type: 'text', label: 'Кнопка', required: true },
          ],
        },
        {
          label: 'Что будет дальше',
          fields: [
            {
              name: 'nextSteps',
              type: 'array',
              label: 'Шаги в боковой колонке',
              labels: { singular: 'Шаг', plural: 'Шаги' },
              maxRows: 4,
              fields: [
                { name: 'title', type: 'text', label: 'Заголовок', required: true },
                { name: 'text', type: 'text', label: 'Пояснение' },
              ],
            },
          ],
        },
        {
          label: 'Экран успеха',
          name: 'success',
          fields: [
            { name: 'heading', type: 'text', label: 'Заголовок', required: true },
            { name: 'subheading', type: 'text', label: 'Подзаголовок' },
            { name: 'nextText', type: 'textarea', label: 'Что будет дальше' },
            { name: 'waitlistText', type: 'textarea', label: 'Текст для листа ожидания' },
            { name: 'contactPrompt', type: 'text', label: 'Приглашение написать' },
          ],
        },
      ],
    },
  ],
}
