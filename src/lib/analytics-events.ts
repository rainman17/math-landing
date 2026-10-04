// Единая карта событий аналитики (ТЗ, раздел 10). Названия меняются только здесь.
// Цели в Яндекс Метрике создаются типа «JavaScript-событие» с этими идентификаторами.
export const EVENTS = {
  pageView: 'page_view',
  ctaClick: 'cta_click',
  formStep1Submit: 'form_step1_submit',
  formComplete: 'form_complete',
  contactClick: 'contact_click',
  // Следующие события появятся на своих этапах:
  testStart: 'test_start',
  testComplete: 'test_complete',
  paymentStart: 'payment_start',
  paymentSuccess: 'payment_success',
  refundRequest: 'refund_request',
  refundCompleted: 'refund_completed',
  communityCtaClick: 'community_cta_click',
  communityFormSubmit: 'community_form_submit',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// В аналитику не передаются контакты, имена и свободный текст — только коды и категории.
export type EventParams = Record<string, string | number | boolean | undefined>
