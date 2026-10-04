// Фоновые задачи на встроенной очереди Payload (коллекция payload-jobs).
// Задача повторяется с нарастающей паузой, если Telegram или CRM недоступны;
// заявка к этому моменту уже сохранена в базе.
import type { PayloadRequest, TaskConfig } from 'payload'

import {
  buildTeacherMessage,
  buildWebhookBody,
  sendTelegram,
  sendWebhook,
  telegramConfigured,
  webhookConfigured,
  type LeadEvent,
  type TeacherEvent,
} from '../lib/notify'

const RETRIES = { attempts: 6, backoff: { type: 'exponential' as const, delay: 30_000 } }

const recordError = async (req: PayloadRequest, id: string, error: unknown) => {
  await req.payload.update({
    collection: 'applications',
    id,
    data: { lastDeliveryError: `${new Date().toISOString()}: ${(error as Error).message}`.slice(0, 500) },
    overrideAccess: true,
  })
}

export const notifyTeacherTask: TaskConfig<{
  input: { applicationId: string; event: TeacherEvent }
  output: { skipped: boolean }
}> = {
  slug: 'notifyTeacher',
  label: 'Уведомить преподавателя',
  retries: RETRIES,
  inputSchema: [
    { name: 'applicationId', type: 'text', required: true },
    { name: 'event', type: 'text', required: true },
  ],
  outputSchema: [{ name: 'skipped', type: 'checkbox' }],
  handler: async ({ input, req }) => {
    const lead = await req.payload.findByID({
      collection: 'applications',
      id: input.applicationId,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    // Напоминание о незавершённой заявке не нужно, если родитель уже дозаполнил форму.
    if (!lead || (input.event === 'incomplete' && lead.stage !== 'step1')) {
      return { output: { skipped: true } }
    }
    if (!telegramConfigured()) return { output: { skipped: true } }

    try {
      await sendTelegram(buildTeacherMessage(lead, input.event))
    } catch (error) {
      await recordError(req, String(lead.id), error)
      throw error
    }
    await req.payload.update({
      collection: 'applications',
      id: lead.id,
      data: { teacherNotifiedAt: new Date().toISOString(), lastDeliveryError: null },
      overrideAccess: true,
    })
    return { output: { skipped: false } }
  },
}

export const deliverWebhookTask: TaskConfig<{
  input: { applicationId: string; event: LeadEvent }
  output: { skipped: boolean }
}> = {
  slug: 'deliverWebhook',
  label: 'Передать заявку в CRM/таблицу',
  retries: RETRIES,
  inputSchema: [
    { name: 'applicationId', type: 'text', required: true },
    { name: 'event', type: 'text', required: true },
  ],
  outputSchema: [{ name: 'skipped', type: 'checkbox' }],
  handler: async ({ input, job, req }) => {
    if (!webhookConfigured()) return { output: { skipped: true } }
    const lead = await req.payload.findByID({
      collection: 'applications',
      id: input.applicationId,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (!lead) return { output: { skipped: true } }

    try {
      await sendWebhook(buildWebhookBody(lead, input.event), String(job.id))
    } catch (error) {
      await recordError(req, String(lead.id), error)
      throw error
    }
    await req.payload.update({
      collection: 'applications',
      id: lead.id,
      data: { webhookDeliveredAt: new Date().toISOString(), lastDeliveryError: null },
      overrideAccess: true,
    })
    return { output: { skipped: false } }
  },
}
