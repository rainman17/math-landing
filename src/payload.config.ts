import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isAdmin } from './access'
import { Applications } from './collections/Applications'
import { FaqItems } from './collections/FaqItems'
import { LegalPages } from './collections/LegalPages'
import { Levels } from './collections/Levels'
import { Media } from './collections/Media'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { ApplyForm } from './globals/ApplyForm'
import { Landing } from './globals/Landing'
import { SiteSettings } from './globals/SiteSettings'
import { deliverWebhookTask, notifyTeacherTask } from './jobs/tasks'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
const isProduction = process.env.NODE_ENV === 'production'

export default buildConfig({
  // Проверка источника cookie (csrf) опирается на заголовок Sec-Fetch-Site, который браузер шлёт
  // только по HTTPS и на localhost. В production сайт работает по HTTPS — проверка включена.
  // В разработке serverURL не задаём (Payload сам добавил бы его в csrf), и админка работает
  // по относительным адресам — и с localhost, и по IP из локальной сети.
  serverURL: isProduction ? siteUrl : undefined,
  csrf: isProduction ? [siteUrl] : [],
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Мысли как математик' },
    dateFormat: 'dd.MM.yyyy HH:mm',
  },
  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: 'ru',
  },
  collections: [Applications, Levels, FaqItems, Testimonials, LegalPages, Media, Users],
  globals: [Landing, ApplyForm, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  telemetry: false,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    // В production схема меняется только миграциями; они применяются при старте приложения.
    prodMigrations: migrations,
  }),
  sharp,
  jobs: {
    tasks: [notifyTeacherTask, deliverWebhookTask],
    access: { run: ({ req }) => isAdmin({ req }) as boolean },
    autoRun: [{ cron: '* * * * *', limit: 20, queue: 'default' }],
    shouldAutoRun: () =>
      process.env.JOBS_AUTORUN !== 'false' && process.env.NEXT_PHASE !== 'phase-production-build',
  },
})
