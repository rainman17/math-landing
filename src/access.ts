import type { Access, FieldAccess, PayloadRequest } from 'payload'

// admin — всё, включая сотрудников; teacher — заявки и контент; editor — только контент.
// Редактор контента не видит контакты родителей.
export type Role = 'admin' | 'teacher' | 'editor'

const roleOf = (req: PayloadRequest): Role | undefined =>
  (req.user as { role?: Role } | null | undefined)?.role

export const hasRole = (req: PayloadRequest, roles: Role[]) => {
  const role = roleOf(req)
  return Boolean(role && roles.includes(role))
}

export const isAdmin: Access = ({ req }) => hasRole(req, ['admin'])
export const isAdminField: FieldAccess = ({ req }) => hasRole(req, ['admin'])
export const canManageLeads: Access = ({ req }) => hasRole(req, ['admin', 'teacher'])
export const canEditContent: Access = ({ req }) => hasRole(req, ['admin', 'teacher', 'editor'])
export const anyone: Access = () => true

/** Публично видны только опубликованные записи; сотрудники видят все. */
export const publishedOrStaff: Access = ({ req }) =>
  req.user ? true : { published: { equals: true } }

export const denyField: FieldAccess = () => false
