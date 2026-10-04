// Настройки сайта. Это единственный файл, который нужно править при подключении формы и аналитики.
// Как получить адрес формы и идентификаторы полей — docs/GOOGLE_FORM.md
window.MKM_CONFIG = {
  googleForm: {
    // Адрес отправки: https://docs.google.com/forms/d/e/<ID формы>/formResponse
    // Форма «Заявки»
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSc9hLLiBOX4JdQwQhmeOEvrzmuySOcN30o4uqVhzLRmNxn2GQ/formResponse',
    // Поле сайта → идентификатор вопроса в Google-форме (entry.123456789)
    fields: {
      parentName: 'entry.2093921877', // Имя родителя
      contact: 'entry.928429130', // Телефон или Telegram
      email: 'entry.423205885', // Email
      grade: 'entry.134625774', // Класс ребёнка
      level: 'entry.2130530700', // Интересующий уровень
      goal: 'entry.349023953', // Главная цель
      schedule: 'entry.1437386218', // Удобное время
      timezone: 'entry.1896690859', // Часовой пояс
      comment: 'entry.1674785312', // Комментарий
      consent: 'entry.1823047937', // Согласие на обработку данных
      source: 'entry.803253683', // Источник (UTM, заполняется автоматически)
    },
  },

  // Версия текста согласия — сохраняется вместе с заявкой. Меняйте вместе с текстом consent.html
  consentVersion: 'черновик от 04.10.2026',

  // Номер счётчика Яндекс Метрики (только цифры). Пусто — аналитика выключена
  metrikaId: '',
  // Включать Метрику только после согласия на cookie (решение — за юристом)
  requireCookieConsent: true,

  // Ссылка на Telegram для связи. Пусто — кнопка «Написать» не показывается
  telegramUrl: '',
  // Реальный срок ответа на заявку — показывается после отправки
  responseTime: 'в течение 1 рабочего дня',
}
