import type { CollectionConfig } from 'payload'

import { hasRole, isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Сотрудник', plural: 'Сотрудники' },
  admin: {
    useAsTitle: 'email',
    group: 'Настройки',
    defaultColumns: ['email', 'name', 'role'],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: { sameSite: 'Lax' },
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: ({ req }) => {
      if (hasRole(req, ['admin'])) return true
      return req.user ? { id: { equals: req.user.id } } : false
    },
    create: isAdmin,
    update: ({ req }) => {
      if (hasRole(req, ['admin'])) return true
      return req.user ? { id: { equals: req.user.id } } : false
    },
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      // Первый сотрудник, созданный через экран регистрации, становится администратором.
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
        if (totalDocs === 0) data.role = 'admin'
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Имя' },
    {
      name: 'role',
      type: 'select',
      label: 'Роль',
      required: true,
      defaultValue: 'teacher',
      saveToJWT: true,
      access: { update: isAdminField },
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Преподаватель (заявки и контент)', value: 'teacher' },
        { label: 'Редактор (только контент)', value: 'editor' },
      ],
      admin: {
        description: 'Редактор не видит заявки и контакты родителей.',
      },
    },
  ],
}
