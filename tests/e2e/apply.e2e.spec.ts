// Сквозные проверки по критериям приёмки ТЗ (A-01, A-02, A-05, A-08, A-09, A-12).
// Требуют запущенной базы и засеянного контента: docker-compose up -d && npm run seed
import { expect, test, type Page } from '@playwright/test'

const fillStep1 = async (page: Page, prefix = '') => {
  await page.fill(`#${prefix}parentName`, 'Тестовый Родитель')
  await page.fill(`#${prefix}contact`, '+7 999 000-00-00')
  await page.fill(`#${prefix}email`, 'e2e@example.ru')
  await page.click(`label[for=${prefix}grade-8]`)
  await page.check(`#${prefix}consentPersonalData`)
  // Сервер отбрасывает формы, заполненные быстрее 2 секунд (защита от ботов).
  await page.waitForTimeout(2100)
}

for (const width of [360, 768, 1280]) {
  test(`A-01: главная без горизонтального скролла на ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
}

test('A-02: CTA и якоря ведут на нужные экраны', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.locator('.hero').getByRole('link', { name: 'Подобрать группу' }).click()
  await expect(page).toHaveURL(/\/apply$/)

  await page.goto('/')
  await page.locator('#levels .level-card').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/apply\?level=start/)
  await expect(page.getByText('Вы смотрели уровень «Старт в алгебре»')).toBeVisible()

  await page.goto('/')
  await page.locator('.header-nav').getByRole('link', { name: 'FAQ' }).click()
  await expect(page).toHaveURL(/#faq$/)
})

test('A-05, A-08, A-09: ошибки у полей, данные не теряются, фокус на первом поле с ошибкой', async ({ page }) => {
  await page.goto('/apply')
  await page.fill('#email', 'not-an-email')
  await page.click('form button[type=submit]')

  await expect(page.locator('#parentName')).toBeFocused()
  await expect(page.getByText('Укажите, как к вам обращаться')).toBeVisible()
  await expect(page.getByText('Проверьте email')).toBeVisible()
  await expect(page.getByText('Отметьте согласие')).toBeVisible()
  await expect(page.locator('#email')).toHaveValue('not-an-email')
  await expect(page).toHaveURL(/\/apply$/)
})

test('A-12: полный путь заявки до экрана успеха', async ({ page }) => {
  await page.goto('/apply')
  await fillStep1(page)
  await page.click('form button[type=submit]')
  await expect(page).toHaveURL(/\/apply\/details$/)
  await expect(page.getByText('Контакт сохранён')).toBeVisible()

  // Возврат на шаг 1 подставляет сохранённый контакт (A-03: лид уже создан).
  await page.goto('/apply')
  await expect(page.locator('#parentName')).toHaveValue('Тестовый Родитель')
  await page.goto('/apply/details')

  await page.click('label[for=goal-start]')
  await page.click('label[for=schedule-weekend]')
  await page.click('form button[type=submit]')
  await expect(page).toHaveURL(/\/success$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Заявка получена')
  await expect(page.getByText('Срок ответа:')).toBeVisible()
  await expect(page.getByText('Спокойно начать алгебру')).toBeVisible()
})

test('короткая форма в финальном блоке ведёт на шаг 2', async ({ page }) => {
  await page.goto('/#final-cta')
  await fillStep1(page, 'final-')
  await page.locator('#final-cta form button[type=submit]').click()
  await expect(page).toHaveURL(/\/apply\/details$/)
})

test('шаг 2 без сохранённого контакта возвращает на шаг 1', async ({ page }) => {
  await page.goto('/apply/details')
  await expect(page).toHaveURL(/\/apply$/)
})
