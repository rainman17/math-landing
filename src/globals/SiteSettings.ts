import type { GlobalConfig } from 'payload'

import { anyone, canEditContent, isAdminField } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: { group: 'Настройки' },
  access: { read: anyone, update: canEditContent },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Общее',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'brandName', type: 'text', label: 'Бренд', required: true, defaultValue: 'Мысли как математик' },
                { name: 'courseName', type: 'text', label: 'Название курса', required: true, defaultValue: 'Как рождается алгебра' },
              ],
            },
            {
              name: 'responseTime',
              type: 'text',
              label: 'Срок ответа на заявку',
              required: true,
              admin: { description: 'Только реальный срок, который преподаватель соблюдает. Показывается на экране успеха.' },
            },
            {
              name: 'operatorDetails',
              type: 'textarea',
              label: 'Реквизиты исполнителя для подвала',
              admin: { description: 'Например: ИП Иванова И. И., ИНН 000000000000. Пусто — не показывается.' },
            },
          ],
        },
        {
          label: 'Контакты',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'telegramUrl', type: 'text', label: 'Ссылка на Telegram', admin: { description: 'https://t.me/username' } },
                { name: 'telegramLabel', type: 'text', label: 'Подпись', defaultValue: 'Написать в Telegram' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email', label: 'Email для связи' },
                { name: 'phone', type: 'text', label: 'Телефон для связи' },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', label: 'Title главной', required: true },
            { name: 'seoDescription', type: 'textarea', label: 'Description главной', required: true },
            { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Картинка для соцсетей (1200×630)' },
          ],
        },
        {
          label: 'Аналитика',
          fields: [
            {
              name: 'yandexMetrikaId',
              type: 'text',
              label: 'Номер счётчика Яндекс Метрики',
              admin: { description: 'Только цифры. Пусто — аналитика выключена.' },
              validate: (value: unknown) =>
                !value || /^\d{5,12}$/.test(String(value)) ? true : 'Номер счётчика — только цифры',
            },
            {
              name: 'requireCookieConsent',
              type: 'checkbox',
              label: 'Включать Метрику только после согласия на cookie',
              defaultValue: true,
              admin: { description: 'Решение — за юристом. Пока включено, показывается баннер cookie.' },
            },
          ],
        },
        {
          label: 'Блоки и функции',
          fields: [
            {
              name: 'showTestCta',
              type: 'checkbox',
              label: 'Показывать кнопку «Пройти короткое тестирование»',
              defaultValue: false,
              admin: { description: 'Включать после запуска тестирования (этап 2).' },
            },
            {
              name: 'showTeachersBlock',
              type: 'checkbox',
              label: 'Показывать блок «Для учителей»',
              defaultValue: false,
              admin: { description: 'Включать после запуска формы комьюнити (этап 5) — иначе кнопка ведёт на несуществующую страницу.' },
            },
          ],
        },
        {
          label: 'Согласия',
          fields: [
            {
              name: 'consentVersion',
              type: 'text',
              label: 'Текущая версия согласия на обработку данных',
              required: true,
              access: { update: isAdminField },
              admin: { description: 'Сохраняется в каждой заявке. Меняйте вместе с текстом документа /consent.' },
            },
          ],
        },
      ],
    },
  ],
}
