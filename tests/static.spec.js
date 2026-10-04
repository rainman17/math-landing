// Проверки статической версии: вёрстка, форма, отправка в Google Forms (запрос перехватывается).
import { expect, test } from '@playwright/test'

const FORM_ACTION = 'https://docs.google.com/forms/d/e/TEST_FORM/formResponse'
const FIELDS = {
  parentName: 'entry.101',
  contact: 'entry.102',
  email: 'entry.103',
  grade: 'entry.104',
  level: 'entry.105',
  goal: 'entry.106',
  schedule: 'entry.107',
  timezone: 'entry.108',
  comment: 'entry.109',
  consent: 'entry.110',
  source: 'entry.111',
}

/** Подменяет config.js настроенной формой и перехватывает отправку в Google. */
async function configureForm(page, { fail = false } = {}) {
  const sent = []
  await page.route('**/assets/js/config.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.MKM_CONFIG = ${JSON.stringify({
        googleForm: { action: FORM_ACTION, fields: FIELDS },
        consentVersion: '1.0',
        metrikaId: '',
        requireCookieConsent: true,
        telegramUrl: 'https://t.me/mkm_teacher',
        responseTime: 'в течение дня',
      })}`,
    }),
  )
  await page.route('https://docs.google.com/**', (route) => {
    if (fail) return route.abort('internetdisconnected')
    sent.push(Object.fromEntries(new URLSearchParams(route.request().postData() || '')))
    return route.fulfill({ status: 200, body: '' })
  })
  return sent
}

async function fillValid(page) {
  await page.fill('#parentName', 'Анна')
  await page.fill('#contact', '8 (999) 123-45-67')
  await page.fill('#email', 'Anna@Mail.ru')
  await page.click('label:has(input[name=grade][value="7"])')
  await page.selectOption('#goal', 'Понять школьную алгебру')
  await page.click('label:has(input[value="Выходные (10–15)"])')
  await page.fill('#comment', 'Решает по образцу')
  await page.check('#consent')
  await page.waitForTimeout(2100) // защита от ботов: форма, отправленная быстрее 2 с, не уходит
}

for (const width of [360, 768, 1280]) {
  test(`нет горизонтального скролла на ${width}px, шрифт загружен`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.fonts.check('16px "Golos Text"', 'Алгебра'))).toBe(true)
  })
}

test('до отправки блок успеха скрыт; без Telegram кнопки «Написать» нет', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.locator('#lead-form')).toBeVisible()
  await expect(page.locator('.form-success')).toBeHidden()
  await expect(page.locator('.form-alert')).toBeHidden()
  await expect(page.locator('.header-contact')).toBeHidden()
})

test('ошибки у полей, фокус на первом, введённое сохраняется', async ({ page }) => {
  await page.goto('/')
  await page.fill('#email', 'not-an-email')
  await page.click('#lead-form button[type=submit]')
  await expect(page.locator('#parentName')).toBeFocused()
  await expect(page.locator('#parentName-error')).toContainText('Укажите, как к вам обращаться')
  await expect(page.locator('#email-error')).toContainText('Проверьте email')
  await expect(page.locator('#grade-error')).toBeVisible()
  await expect(page.locator('#goal-error')).toBeVisible()
  await expect(page.locator('#consent-error')).toContainText('согласие')
  await expect(page.locator('#email')).toHaveValue('not-an-email')
})

test('без настроенной формы заявка не уходит и показывается подсказка', async ({ page }) => {
  let requests = 0
  await page.route('https://docs.google.com/**', (route) => {
    requests++
    return route.abort()
  })
  await page.goto('/')
  await fillValid(page)
  await page.click('#lead-form button[type=submit]')
  await expect(page.locator('.form-alert')).toContainText('Отправка ещё не настроена')
  expect(requests).toBe(0)
})

test('заявка уходит в Google-форму с правильными полями', async ({ page }) => {
  const sent = await configureForm(page)
  await page.goto('/?utm_source=yandex&utm_campaign=autumn')
  await page.locator('#levels .level-card').nth(1).getByRole('link').click()
  await expect(page.locator('#level')).toHaveValue('Понимание школьной алгебры')
  await fillValid(page)
  await page.click('#lead-form button[type=submit]')

  await expect(page.locator('.form-success')).toBeVisible()
  await expect(page.locator('.form-success [data-telegram]')).toHaveAttribute('href', 'https://t.me/mkm_teacher')
  expect(sent).toHaveLength(1)
  const body = sent[0]
  expect(body[FIELDS.parentName]).toBe('Анна')
  expect(body[FIELDS.contact]).toBe('+79991234567')
  expect(body[FIELDS.email]).toBe('anna@mail.ru')
  expect(body[FIELDS.grade]).toBe('7')
  expect(body[FIELDS.level]).toBe('Понимание школьной алгебры')
  expect(body[FIELDS.goal]).toBe('Понять школьную алгебру')
  expect(body[FIELDS.schedule]).toBe('Выходные (10–15)')
  expect(body[FIELDS.comment]).toBe('Решает по образцу')
  expect(body[FIELDS.consent]).toMatch(/^Да — версия «1\.0»/)
  expect(body[FIELDS.source]).toContain('utm_source=yandex')
  expect(body[FIELDS.source]).toContain('utm_campaign=autumn')

  // Черновик очищен — после перезагрузки форма пустая
  await page.reload()
  await expect(page.locator('#parentName')).toHaveValue('')
})

test('черновик восстанавливается после перезагрузки', async ({ page }) => {
  await page.goto('/')
  await page.fill('#parentName', 'Ольга')
  await page.fill('#contact', '@olga_parent')
  await page.click('label:has(input[name=grade][value="9"])')
  await page.reload()
  await expect(page.locator('#parentName')).toHaveValue('Ольга')
  await expect(page.locator('#contact')).toHaveValue('@olga_parent')
  await expect(page.locator('input[name=grade][value="9"]')).toBeChecked()
})

test('нет сети — понятная ошибка, данные остаются', async ({ page }) => {
  await configureForm(page, { fail: true })
  await page.goto('/')
  await fillValid(page)
  await page.click('#lead-form button[type=submit]')
  await expect(page.locator('.form-alert')).toContainText('Не получилось отправить')
  await expect(page.locator('#parentName')).toHaveValue('Анна')
  await expect(page.locator('#lead-form button[type=submit]')).toBeEnabled()
})

test('бот, заполнивший скрытое поле, видит успех, но ничего не отправляется', async ({ page }) => {
  const sent = await configureForm(page)
  await page.goto('/')
  await fillValid(page)
  await page.evaluate(() => {
    document.getElementById('website').value = 'spam'
  })
  await page.click('#lead-form button[type=submit]')
  await expect(page.locator('.form-success')).toBeVisible()
  expect(sent).toHaveLength(0)
})

test('мобильное меню и закреплённая кнопка', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')
  await page.click('.mobile-menu-toggle')
  await expect(page.locator('#mobile-menu')).toBeVisible()
  await page.locator('#mobile-menu').getByRole('link', { name: 'Уровни' }).click()
  await expect(page.locator('#mobile-menu')).toBeHidden()
  await expect(page.locator('.sticky-cta')).toHaveClass(/is-visible/)
})
