import type { CollectionConfig, Field } from 'payload'

import { canManageLeads, denyField } from '../access'
import {
  APPLICATION_STAGES,
  APPLICATION_STATUSES,
  GOALS,
  PERSONAL_ROUTE,
  SCHEDULE,
  TIMEZONES,
} from '../lib/options'

// Служебное поле: в админке скрыто, через API не читается и не меняется.
// Сервер работает с ним через Local API с overrideAccess.
const internal = (field: Field): Field =>
  ({
    ...field,
    admin: { ...(field.admin ?? {}), hidden: true },
    access: { read: denyField, create: denyField, update: denyField },
  }) as Field

const consentGroup = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  admin: { readOnly: true },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'accepted', type: 'checkbox', label: 'Дано' },
        { name: 'version', type: 'text', label: 'Версия текста' },
        { name: 'acceptedAt', type: 'date', label: 'Когда', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
})

export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: { singular: 'Заявка родителя', plural: 'Заявки родителей' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Заявки',
    useAsTitle: 'parentName',
    defaultColumns: ['parentName', 'grade', 'stage', 'status', 'waitlist', 'levelHint', 'createdAt'],
    listSearchableFields: ['parentName', 'contact', 'email', 'childName'],
    description:
      'Заявка создаётся после первого шага формы. «Только шаг 1» — родитель оставил контакт, но не дошёл до цели и расписания.',
  },
  access: {
    read: canManageLeads,
    create: canManageLeads,
    update: canManageLeads,
    delete: canManageLeads,
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      label: 'Статус обработки',
      required: true,
      defaultValue: 'new',
      options: APPLICATION_STATUSES,
      admin: { position: 'sidebar' },
    },
    {
      name: 'stage',
      type: 'select',
      label: 'Заполнение формы',
      required: true,
      defaultValue: 'step1',
      options: APPLICATION_STAGES,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'waitlist',
      type: 'checkbox',
      label: 'Лист ожидания',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Родитель отметил, что подходящего времени нет.' },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Заметки преподавателя',
      admin: { position: 'sidebar', description: 'Видны только сотрудникам.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Контакт',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'parentName', type: 'text', label: 'Имя родителя', required: true },
                { name: 'grade', type: 'number', label: 'Класс ребёнка', required: true, min: 6, max: 10 },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'contact', type: 'text', label: 'Телефон или Telegram', required: true },
                {
                  name: 'contactType',
                  type: 'select',
                  label: 'Тип контакта',
                  options: [
                    { label: 'Телефон', value: 'phone' },
                    { label: 'Telegram', value: 'telegram' },
                  ],
                },
                { name: 'email', type: 'email', label: 'Email', required: true },
              ],
            },
            {
              name: 'levelHint',
              type: 'text',
              label: 'Выбранный уровень',
              admin: { description: 'Предположение родителя с карточки уровня. Окончательно уровень определяет преподаватель.' },
            },
          ],
        },
        {
          label: 'Цель и расписание',
          fields: [
            { name: 'childName', type: 'text', label: 'Имя или инициалы ребёнка' },
            {
              type: 'row',
              fields: [
                { name: 'goal', type: 'select', label: 'Главная цель', options: GOALS.map(({ value, label }) => ({ value, label })) },
                { name: 'goalOther', type: 'text', label: 'Цель своими словами' },
              ],
            },
            { name: 'desiredResult', type: 'textarea', label: 'Желаемый результат' },
            { name: 'difficulties', type: 'textarea', label: 'Что сейчас трудно' },
            {
              name: 'schedule',
              type: 'select',
              label: 'Удобное время',
              hasMany: true,
              options: SCHEDULE.map(({ value, label }) => ({ value, label: `${label} (${SCHEDULE.find((s) => s.value === value)?.hint})` })),
            },
            { name: 'scheduleComment', type: 'text', label: 'Комментарий к расписанию' },
            {
              type: 'row',
              fields: [
                { name: 'timezone', type: 'select', label: 'Часовой пояс', options: TIMEZONES.map(({ value, label }) => ({ value, label })) },
                { name: 'personalRoute', type: 'select', label: 'Интерес к «Персональному маршруту»', options: PERSONAL_ROUTE },
              ],
            },
          ],
        },
        {
          label: 'Согласия',
          fields: [
            consentGroup('consentPersonalData', 'Обработка персональных данных'),
            consentGroup('consentMarketing', 'Сообщения о новых наборах'),
          ],
        },
        {
          label: 'Источник',
          fields: [
            {
              name: 'utm',
              type: 'group',
              label: 'UTM-метки',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'source', type: 'text', label: 'utm_source' },
                    { name: 'medium', type: 'text', label: 'utm_medium' },
                    { name: 'campaign', type: 'text', label: 'utm_campaign' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'term', type: 'text', label: 'utm_term' },
                    { name: 'content', type: 'text', label: 'utm_content' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'referrer', type: 'text', label: 'Откуда пришли', admin: { readOnly: true } },
                { name: 'landingPage', type: 'text', label: 'Страница входа', admin: { readOnly: true } },
                {
                  name: 'device',
                  type: 'select',
                  label: 'Устройство',
                  admin: { readOnly: true },
                  options: [
                    { label: 'Телефон', value: 'mobile' },
                    { label: 'Планшет', value: 'tablet' },
                    { label: 'Компьютер', value: 'desktop' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Служебное',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'step1At', type: 'date', label: 'Шаг 1 отправлен', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'completedAt', type: 'date', label: 'Заявка заполнена', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'teacherNotifiedAt', type: 'date', label: 'Уведомление преподавателю', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'webhookDeliveredAt', type: 'date', label: 'Передано в CRM/таблицу', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            { name: 'lastDeliveryError', type: 'text', label: 'Последняя ошибка доставки', admin: { readOnly: true } },
            internal({ name: 'resumeTokenHash', type: 'text', index: true }),
            internal({ name: 'idempotencyKey', type: 'text', unique: true }),
          ],
        },
      ],
    },
  ],
}
