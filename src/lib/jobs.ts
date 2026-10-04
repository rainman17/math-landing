import 'server-only'

import { after } from 'next/server'

import type { LeadEvent, TeacherEvent } from './notify'
import { getPayloadClient } from './payload'

const INCOMPLETE_REMINDER_DELAY_MS = 30 * 60 * 1000

type Queue = { teacher?: TeacherEvent; webhook?: LeadEvent }

/**
 * Ставит задачи доставки в очередь и запускает их сразу после ответа пользователю.
 * Если доставка не удалась, задачи повторит планировщик (раз в минуту, с паузами).
 */
export async function queueLeadDelivery(applicationId: number, { teacher, webhook }: Queue) {
  const payload = await getPayloadClient()
  const id = String(applicationId)

  if (webhook) {
    await payload.jobs.queue({ task: 'deliverWebhook', input: { applicationId: id, event: webhook } })
  }
  if (teacher === 'completed') {
    await payload.jobs.queue({ task: 'notifyTeacher', input: { applicationId: id, event: 'completed' } })
  }
  if (teacher === 'incomplete') {
    // Через 30 минут проверим: если родитель так и не заполнил шаг 2 — сообщим преподавателю.
    await payload.jobs.queue({
      task: 'notifyTeacher',
      input: { applicationId: id, event: 'incomplete' },
      waitUntil: new Date(Date.now() + INCOMPLETE_REMINDER_DELAY_MS),
    })
  }

  after(async () => {
    try {
      await payload.jobs.run({ limit: 10 })
    } catch (error) {
      payload.logger.error({ err: error }, 'Не удалось запустить задачи доставки заявки')
    }
  })
}
