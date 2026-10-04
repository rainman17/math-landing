// Доставка заявок наружу: уведомление преподавателю в Telegram и webhook в CRM/таблицу.
// Вызывается только из фоновых задач (src/jobs) — ошибка доставки не теряет заявку,
// задача повторится автоматически.
import crypto from 'node:crypto'

import type { Application } from '../payload-types'
import { GOALS, PERSONAL_ROUTE, SCHEDULE, TIMEZONES, labelOf } from './options'

const siteUrl = () => (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export type LeadEvent = 'lead.step1' | 'lead.completed' | 'lead.updated'
export type TeacherEvent = 'completed' | 'incomplete'

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

export function webhookConfigured() {
  return Boolean(process.env.LEADS_WEBHOOK_URL)
}

/**
 * Текст уведомления. Контакты и имя ребёнка по умолчанию не отправляются в Telegram
 * (серверы мессенджера за пределами РФ) — преподаватель открывает заявку в админке.
 * TELEGRAM_INCLUDE_CONTACTS=true включает их явно.
 */
export function buildTeacherMessage(lead: Application, event: TeacherEvent): string {
  const includeContacts = process.env.TELEGRAM_INCLUDE_CONTACTS === 'true'
  const lines: string[] = []

  if (event === 'completed') {
    lines.push(lead.waitlist ? '🕓 <b>Новая заявка — лист ожидания</b>' : '🆕 <b>Новая заявка</b>')
  } else {
    lines.push('⏳ <b>Незавершённая заявка</b> — родитель оставил контакт, но не заполнил цель и расписание')
  }

  lines.push(`Класс: ${lead.grade}`)
  if (lead.levelHint) lines.push(`Выбранный уровень: ${escapeHtml(lead.levelHint)}`)

  if (event === 'completed') {
    const goal = lead.goal === 'other' ? lead.goalOther : labelOf(GOALS, lead.goal)
    if (goal) lines.push(`Цель: ${escapeHtml(goal)}`)
    const schedule = (lead.schedule ?? []).map((slot) => labelOf(SCHEDULE, slot)).join(', ')
    if (schedule) lines.push(`Время: ${escapeHtml(schedule)}`)
    if (lead.scheduleComment) lines.push(`Комментарий: ${escapeHtml(lead.scheduleComment)}`)
    if (lead.timezone) lines.push(`Часовой пояс: ${escapeHtml(labelOf(TIMEZONES, lead.timezone))}`)
    if (lead.personalRoute === 'yes') lines.push(`Персональный маршрут: ${labelOf(PERSONAL_ROUTE, lead.personalRoute)}`)
  }

  if (includeContacts) {
    lines.push('')
    lines.push(`Родитель: ${escapeHtml(lead.parentName)}`)
    lines.push(`Контакт: ${escapeHtml(lead.contact)}`)
    lines.push(`Email: ${escapeHtml(lead.email)}`)
  }

  if (lead.utm?.source) lines.push(`Источник: ${escapeHtml(lead.utm.source)}`)

  lines.push('')
  lines.push(`<a href="${siteUrl()}/admin/collections/applications/${lead.id}">Открыть заявку в админке</a>`)
  return lines.join('\n')
}

export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    // Тело ответа Telegram не содержит токен, его безопасно показать в ошибке.
    throw new Error(`Telegram API ответил ${response.status}: ${(await response.text()).slice(0, 300)}`)
  }
}

/** Плоская запись для CRM или таблицы. Получатель обновляет строку по lead_id. */
export function buildWebhookBody(lead: Application, event: LeadEvent) {
  return {
    event,
    sent_at: new Date().toISOString(),
    lead_id: lead.id,
    created_at: lead.createdAt,
    stage: lead.stage,
    status: lead.status,
    waitlist: Boolean(lead.waitlist),
    parent_name: lead.parentName,
    contact: lead.contact,
    contact_type: lead.contactType ?? null,
    email: lead.email,
    grade: lead.grade,
    level_hint: lead.levelHint ?? null,
    child_name: lead.childName ?? null,
    goal: lead.goal ?? null,
    goal_label: lead.goal === 'other' ? lead.goalOther ?? null : labelOf(GOALS, lead.goal) || null,
    desired_result: lead.desiredResult ?? null,
    difficulties: lead.difficulties ?? null,
    schedule: (lead.schedule ?? []).map((slot) => labelOf(SCHEDULE, slot)).join(', ') || null,
    schedule_comment: lead.scheduleComment ?? null,
    timezone: lead.timezone ?? null,
    personal_route: lead.personalRoute ?? null,
    consent_personal_data: Boolean(lead.consentPersonalData?.accepted),
    consent_version: lead.consentPersonalData?.version ?? null,
    consent_marketing: Boolean(lead.consentMarketing?.accepted),
    utm_source: lead.utm?.source ?? null,
    utm_medium: lead.utm?.medium ?? null,
    utm_campaign: lead.utm?.campaign ?? null,
    utm_term: lead.utm?.term ?? null,
    utm_content: lead.utm?.content ?? null,
    referrer: lead.referrer ?? null,
    device: lead.device ?? null,
    admin_url: `${siteUrl()}/admin/collections/applications/${lead.id}`,
  }
}

export async function sendWebhook(body: ReturnType<typeof buildWebhookBody>, deliveryId: string): Promise<void> {
  const url = process.env.LEADS_WEBHOOK_URL
  if (!url) return

  const json = JSON.stringify(body)
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-mkm-event': body.event,
    'x-mkm-delivery': deliveryId,
  }
  const secret = process.env.LEADS_WEBHOOK_SECRET
  if (secret) {
    headers['x-mkm-signature'] = `sha256=${crypto.createHmac('sha256', secret).update(json).digest('hex')}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: json,
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    throw new Error(`Webhook ответил ${response.status}`)
  }
}
