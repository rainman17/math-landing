import type { CollectionConfig } from 'payload'

import { canEditContent, publishedOrStaff } from '../access'
import { ENROLLMENT_STATUSES } from '../lib/options'

export const Levels: CollectionConfig = {
  slug: 'levels',
  labels: { singular: 'Уровень', plural: 'Уровни и цены' },
  defaultSort: 'sortOrder',
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'enrollmentStatus', 'published', 'sortOrder'],
    description: 'Карточки уровней на главной. Цена, длительность и статус набора меняются здесь — без правки кода.',
  },
  access: {
    read: publishedOrStaff,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', label: 'Название', required: true },
        {
          name: 'slug',
          type: 'text',
          label: 'Код',
          required: true,
          unique: true,
          admin: {
            description: 'Латиницей: start, school, olympiad. Уходит в заявку и аналитику — лучше не менять.',
          },
          validate: (value: unknown) =>
            typeof value === 'string' && /^[a-z0-9-]{1,40}$/.test(value)
              ? true
              : 'Только латинские буквы, цифры и дефис',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'badge', type: 'text', label: 'Метка над названием', admin: { description: 'Например: «Основной маршрут»' } },
        { name: 'grades', type: 'text', label: 'Классы', required: true, admin: { description: 'Например: 6–8 класс' } },
      ],
    },
    { name: 'forWhom', type: 'textarea', label: 'Кому подходит', required: true },
    { name: 'whatHappens', type: 'textarea', label: 'Что будет на занятиях', required: true },
    { name: 'outcome', type: 'textarea', label: 'Результат (без обещания оценки)', required: true },
    {
      type: 'row',
      fields: [
        { name: 'lessonsCount', type: 'number', label: 'Занятий', required: true, min: 1 },
        { name: 'lessonMinutes', type: 'number', label: 'Минут в занятии', required: true, defaultValue: 60, min: 15 },
        { name: 'durationLabel', type: 'text', label: 'Длительность', required: true, admin: { description: '«8 недель», «3 месяца»' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', label: 'Полная стоимость, ₽', required: true, min: 0 },
        { name: 'installmentNote', type: 'text', label: 'Оплата частями', admin: { description: 'Пусто — не показывается' } },
      ],
    },
    {
      name: 'personalRouteSurcharge',
      type: 'text',
      label: 'Доплата за «Персональный маршрут»',
      admin: { description: 'Например: +10 000 ₽ за модуль. Пусто — уровень не показывается в блоке.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enrollmentStatus',
          type: 'select',
          label: 'Статус набора',
          required: true,
          defaultValue: 'open',
          options: ENROLLMENT_STATUSES,
        },
        { name: 'nextStart', type: 'text', label: 'Ближайший старт', admin: { description: 'Например: старт 14 октября' } },
      ],
    },
    {
      name: 'ctaLabel',
      type: 'text',
      label: 'Текст кнопки',
      defaultValue: 'Подобрать группу',
      admin: { description: 'При статусе «Набор закрыт» и «Лист ожидания» кнопка сама меняется на «Встать в лист ожидания».' },
    },
    { name: 'highlighted', type: 'checkbox', label: 'Выделить карточку', admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', label: 'Порядок', defaultValue: 10, admin: { position: 'sidebar' } },
    { name: 'published', type: 'checkbox', label: 'Показывать на сайте', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
