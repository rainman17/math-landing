/**
 * Приёмник заявок в Google-таблицу (Google Apps Script).
 *
 * 1. Создайте таблицу, откройте «Расширения → Apps Script», вставьте этот код.
 * 2. В «Настройки проекта → Свойства скрипта» добавьте TOKEN — длинную случайную строку.
 * 3. «Развернуть → Новое развёртывание → Веб-приложение», доступ: «Все». Скопируйте URL.
 * 4. На сервере сайта: LEADS_WEBHOOK_URL=<URL>?token=<TOKEN>
 *
 * Одна заявка — одна строка: повторные события (шаг 1, заявка заполнена, правка) обновляют
 * строку по lead_id. Apps Script не видит заголовки запроса, поэтому подпись x-mkm-signature
 * здесь не проверяется — защиту даёт токен в адресе.
 *
 * Важно: Google хранит данные за пределами РФ. Использовать только если это допускает
 * согласованная политика обработки персональных данных; иначе — российская CRM.
 */

const SHEET_NAME = 'Заявки'

const COLUMNS = [
  'lead_id', 'created_at', 'event', 'sent_at', 'stage', 'status', 'waitlist',
  'parent_name', 'contact', 'contact_type', 'email', 'grade', 'level_hint',
  'child_name', 'goal_label', 'desired_result', 'difficulties', 'schedule', 'schedule_comment',
  'timezone', 'personal_route', 'consent_personal_data', 'consent_version', 'consent_marketing',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'referrer', 'device', 'admin_url',
]

function doPost(e) {
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN')
  if (!token || e.parameter.token !== token) {
    return ContentService.createTextOutput('forbidden')
  }

  const data = JSON.parse(e.postData.contents)
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const sheet = getSheet()
    const row = COLUMNS.map((key) => (data[key] === null || data[key] === undefined ? '' : data[key]))
    const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().map((r) => String(r[0]))
    const index = ids.indexOf(String(data.lead_id))
    if (index >= 0) {
      sheet.getRange(index + 2, 1, 1, COLUMNS.length).setValues([row])
    } else {
      sheet.appendRow(row)
    }
  } finally {
    lock.releaseLock()
  }
  return ContentService.createTextOutput('ok')
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = book.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME)
    sheet.appendRow(COLUMNS)
    sheet.setFrozenRows(1)
  }
  return sheet
}
