// Логика страницы без сборки и зависимостей. Настройки — в assets/js/config.js
;(function () {
  'use strict'

  var cfg = window.MKM_CONFIG || {}
  var $ = function (selector, root) {
    return (root || document).querySelector(selector)
  }
  var $$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector))
  }
  var storage = {
    get: function (key) {
      try {
        return window.localStorage.getItem(key)
      } catch (e) {
        return null
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, value)
      } catch (e) {
        /* приватный режим — не критично */
      }
    },
    remove: function (key) {
      try {
        window.localStorage.removeItem(key)
      } catch (e) {
        /* ignore */
      }
    },
  }

  // ---------------------------------------------------------------------------
  // Аналитика: Яндекс Метрика (после согласия на cookie, если так настроено)
  // ---------------------------------------------------------------------------

  var CONSENT_KEY = 'mkm_cookie_consent'
  var metrikaId = /^\d{5,12}$/.test(String(cfg.metrikaId || '')) ? Number(cfg.metrikaId) : null

  function track(event, params) {
    var clean = {}
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== '') clean[key] = params[key]
    })
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push(Object.assign({ event: event }, clean))
    if (window.ym && metrikaId) window.ym(metrikaId, 'reachGoal', event, clean)
  }

  function loadMetrika() {
    if (!metrikaId || window.ym) return
    window.ym = function () {
      ;(window.ym.a = window.ym.a || []).push(arguments)
    }
    window.ym.l = Date.now()
    var script = document.createElement('script')
    script.async = true
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    document.head.appendChild(script)
    window.ym(metrikaId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false })
  }

  function initAnalytics() {
    if (!metrikaId) return
    var consent = storage.get(CONSENT_KEY)
    if (!cfg.requireCookieConsent || consent === 'accepted') return loadMetrika()
    if (consent === 'declined') return

    var banner = document.createElement('div')
    banner.className = 'cookie-banner'
    banner.setAttribute('role', 'region')
    banner.setAttribute('aria-label', 'Использование cookie')
    banner.innerHTML =
      '<p>Мы используем cookie и Яндекс Метрику, чтобы понимать, как улучшить сайт. <a href="privacy.html">Подробнее</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-consent="accepted">Принять</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-consent="declined">Только необходимые</button>' +
      '</div>'
    banner.addEventListener('click', function (event) {
      var choice = event.target.getAttribute && event.target.getAttribute('data-consent')
      if (!choice) return
      storage.set(CONSENT_KEY, choice)
      banner.remove()
      if (choice === 'accepted') loadMetrika()
    })
    document.body.appendChild(banner)
  }

  // ---------------------------------------------------------------------------
  // Источник визита (UTM): последний визит с метками перезаписывает предыдущий
  // ---------------------------------------------------------------------------

  var ATTRIBUTION_KEY = 'mkm_attribution'
  var UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content']

  function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search)
      var utm = {}
      UTM_KEYS.forEach(function (key) {
        var value = params.get('utm_' + key)
        if (value) utm[key] = value.slice(0, 200)
      })
      var hasUtm = Object.keys(utm).length > 0
      var stored = JSON.parse(storage.get(ATTRIBUTION_KEY) || 'null')
      var fresh = stored && Date.now() - stored.ts < 30 * 24 * 3600 * 1000
      if (!hasUtm && fresh) return
      var referrer = ''
      if (document.referrer) {
        var refHost = new URL(document.referrer).host
        if (refHost !== window.location.host) referrer = refHost
      }
      storage.set(ATTRIBUTION_KEY, JSON.stringify({ utm: utm, referrer: referrer, ts: Date.now() }))
    } catch (e) {
      /* без UTM заявка всё равно уйдёт */
    }
  }

  function attributionString() {
    var data = {}
    try {
      data = JSON.parse(storage.get(ATTRIBUTION_KEY) || '{}') || {}
    } catch (e) {
      data = {}
    }
    var parts = []
    UTM_KEYS.forEach(function (key) {
      if (data.utm && data.utm[key]) parts.push('utm_' + key + '=' + data.utm[key])
    })
    if (data.referrer) parts.push('откуда=' + data.referrer)
    parts.push('устройство=' + (window.innerWidth < 768 ? 'телефон' : window.innerWidth < 1200 ? 'планшет' : 'компьютер'))
    return parts.join('; ')
  }

  // ---------------------------------------------------------------------------
  // Интерфейс: контакты, меню, модель в первом экране, закреплённая кнопка
  // ---------------------------------------------------------------------------

  function initContent() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear())
    })
    if (cfg.responseTime) {
      $$('[data-response-time]').forEach(function (el) {
        el.textContent = cfg.responseTime
      })
    }
    var telegram = String(cfg.telegramUrl || '').trim()
    if (telegram.indexOf('@') === 0) telegram = 'https://t.me/' + telegram.slice(1)
    if (/^https?:\/\//i.test(telegram)) {
      $$('[data-telegram]').forEach(function (el) {
        el.href = telegram
        el.hidden = false
      })
      $$('[data-telegram-block]').forEach(function (el) {
        el.hidden = false
      })
    }

    $$('[data-model]').forEach(function (el) {
      el.getAttribute('data-model')
        .split(',')
        .forEach(function (count, index) {
          var stack = document.createElement('span')
          stack.className = 'wk-stack'
          stack.style.animationDelay = 250 + index * 80 + 'ms'
          for (var i = 0; i < Number(count); i++) stack.appendChild(document.createElement('i'))
          el.appendChild(stack)
        })
    })
  }

  function initMenu() {
    var toggle = $('.mobile-menu-toggle')
    var panel = $('#mobile-menu')
    if (!toggle || !panel) return
    var setOpen = function (open) {
      panel.hidden = !open
      toggle.setAttribute('aria-expanded', String(open))
      toggle.textContent = open ? 'Закрыть' : 'Меню'
      document.body.classList.toggle('menu-open', open)
    }
    toggle.addEventListener('click', function () {
      setOpen(panel.hidden)
    })
    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false)
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false)
        toggle.focus()
      }
    })
  }

  function initStickyCta() {
    var bar = $('.sticky-cta')
    var hero = $('.hero')
    var apply = $('#apply')
    if (!bar || !hero || !('IntersectionObserver' in window)) return
    var pastHero = false
    var formVisible = false
    var link = $('a', bar)
    var update = function () {
      var visible = pastHero && !formVisible
      bar.classList.toggle('is-visible', visible)
      bar.setAttribute('aria-hidden', String(!visible))
      if (link) link.tabIndex = visible ? 0 : -1
    }
    // Следим за всем первым экраном, а не за точкой: при переходе по якорю или быстром скролле
    // маленький маркер может «перепрыгнуть» экран, и наблюдатель не сработает.
    new IntersectionObserver(function (entries) {
      pastHero = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0
      update()
    }).observe(hero)
    if (apply) {
      new IntersectionObserver(
        function (entries) {
          formVisible = entries[0].isIntersecting
          update()
        },
        { threshold: 0.1 },
      ).observe(apply)
    }
  }

  function initTracking() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest && event.target.closest('[data-track]')
      if (!el) return
      track(el.getAttribute('data-track'), {
        location: el.getAttribute('data-location') || undefined,
        level: el.getAttribute('data-level') || undefined,
      })
    })
  }

  // ---------------------------------------------------------------------------
  // Форма заявки → Google Forms
  // ---------------------------------------------------------------------------

  var DRAFT_KEY = 'mkm_static_draft'
  var TELEGRAM_USERNAME = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/

  /** Телефон или Telegram в едином виде: +79991234567 или @username. null — не распознано. */
  function parseContact(raw) {
    var input = String(raw || '').trim()
    if (!input) return null
    var link = input.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([^/?#\s]+)\/?$/i)
    var candidate = link ? link[1] : input.charAt(0) === '@' ? input.slice(1) : null
    if (candidate !== null) return TELEGRAM_USERNAME.test(candidate) ? '@' + candidate : null
    if (/^[+\d\s().-]+$/.test(input)) {
      var digits = input.replace(/\D/g, '')
      if (input.charAt(0) !== '+') {
        if (digits.length === 11 && digits.charAt(0) === '8') digits = '7' + digits.slice(1)
        else if (digits.length === 10 && digits.charAt(0) === '9') digits = '7' + digits
      }
      if (digits.length < 10 || digits.length > 15) return null
      if (digits.charAt(0) === '7' && digits.length !== 11) return null
      return '+' + digits
    }
    return TELEGRAM_USERNAME.test(input) ? '@' + input : null
  }

  function formConfigured() {
    var gf = cfg.googleForm || {}
    var fields = gf.fields || {}
    var placeholder = /ЗАМЕНИТЬ|entry\.0{6,}/
    if (!gf.action || placeholder.test(gf.action)) return false
    return Object.keys(fields).every(function (key) {
      return fields[key] && !placeholder.test(fields[key])
    })
  }

  function readValues(form) {
    var data = new FormData(form)
    return {
      parentName: String(data.get('parentName') || '').trim(),
      contact: String(data.get('contact') || '').trim(),
      email: String(data.get('email') || '').trim(),
      grade: String(data.get('grade') || ''),
      goal: String(data.get('goal') || ''),
      level: String(data.get('level') || ''),
      schedule: data.getAll('schedule').map(String),
      timezone: String(data.get('timezone') || ''),
      comment: String(data.get('comment') || '').trim(),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') || ''),
    }
  }

  function validate(values) {
    var errors = {}
    if (values.parentName.length < 2) errors.parentName = 'Укажите, как к вам обращаться'
    if (!values.contact) errors.contact = 'Укажите телефон или Telegram'
    else if (!parseContact(values.contact)) errors.contact = 'Проверьте номер или ник: например, +7 999 123-45-67 или @username'
    if (!values.email) errors.email = 'Укажите email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) errors.email = 'Проверьте email: например, name@mail.ru'
    if (!values.grade) errors.grade = 'Выберите класс ребёнка'
    if (!values.goal) errors.goal = 'Выберите главную цель'
    if (!values.consent) errors.consent = 'Отметьте согласие — без него мы не можем обработать заявку'
    return errors
  }

  var FIELD_ORDER = ['parentName', 'contact', 'email', 'grade', 'goal', 'consent']

  function clearError(id) {
    var el = document.getElementById(id)
    if (!el) return
    var field = el.closest('.field') || el
    field.classList.remove('has-error')
    el.removeAttribute('aria-invalid')
    el.removeAttribute('aria-describedby')
    var message = document.getElementById(id + '-error')
    if (message) message.remove()
  }

  function showErrors(errors) {
    FIELD_ORDER.forEach(function (id) {
      clearError(id)
      if (!errors[id]) return
      var el = document.getElementById(id)
      var field = el.closest('.field') || el
      field.classList.add('has-error')
      el.setAttribute('aria-invalid', 'true')
      el.setAttribute('aria-describedby', id + '-error')
      var message = document.createElement('p')
      message.id = id + '-error'
      message.className = 'field-error'
      message.textContent = '⚠ ' + errors[id]
      field.appendChild(message)
    })
    var first = FIELD_ORDER.filter(function (id) {
      return errors[id]
    })[0]
    if (first) {
      var target = document.getElementById(first)
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }

  function syncChoices(form) {
    $$('.choice', form).forEach(function (label) {
      var input = $('input', label)
      label.classList.toggle('is-selected', Boolean(input && input.checked))
    })
  }

  function saveDraft(form) {
    var values = readValues(form)
    delete values.consent
    delete values.website
    storage.set(DRAFT_KEY, JSON.stringify(values))
  }

  function restoreDraft(form) {
    var draft
    try {
      draft = JSON.parse(storage.get(DRAFT_KEY) || 'null')
    } catch (e) {
      draft = null
    }
    if (!draft) return false
    ;['parentName', 'contact', 'email', 'goal', 'level', 'timezone', 'comment'].forEach(function (name) {
      if (draft[name] && form.elements[name]) form.elements[name].value = draft[name]
    })
    $$('input[name=grade]', form).forEach(function (input) {
      input.checked = input.value === draft.grade
    })
    $$('input[name=schedule]', form).forEach(function (input) {
      input.checked = (draft.schedule || []).indexOf(input.value) !== -1
    })
    return Boolean(draft.timezone)
  }

  function detectTimezone(form) {
    var offset = -new Date().getTimezoneOffset() / 60
    var value = 'UTC+' + offset
    var select = form.elements.timezone
    var match = $$('option', select).some(function (option) {
      return option.value === value
    })
    select.value = match ? value : 'другой'
  }

  function initForm() {
    var form = $('#lead-form')
    if (!form) return
    var alertBox = $('.form-alert', form)
    var success = $('.form-success')
    var button = $('button[type=submit]', form)
    var startedAt = Date.now()

    if (!restoreDraft(form)) detectTimezone(form)
    syncChoices(form)

    form.addEventListener('change', function (event) {
      syncChoices(form)
      var name = event.target.name
      if (name) clearError(name === 'grade' ? 'grade' : event.target.id || name)
      saveDraft(form)
    })
    form.addEventListener('input', function (event) {
      if (event.target.id) clearError(event.target.id)
      saveDraft(form)
    })

    // Кнопка на карточке уровня подставляет этот уровень в форму
    $$('[data-level]').forEach(function (cta) {
      cta.addEventListener('click', function () {
        form.elements.level.value = cta.getAttribute('data-level')
        saveDraft(form)
      })
    })

    var showSuccess = function () {
      form.hidden = true
      success.hidden = false
      success.focus()
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault()
      alertBox.hidden = true
      var values = readValues(form)
      var errors = validate(values)
      showErrors(errors)
      if (Object.keys(errors).length) return

      // Ловушки для ботов: скрытое поле или мгновенная отправка — делаем вид, что всё хорошо
      if (values.website || Date.now() - startedAt < 2000) return showSuccess()

      if (!formConfigured()) {
        alertBox.textContent =
          'Отправка ещё не настроена: укажите адрес Google-формы и поля в assets/js/config.js (см. docs/GOOGLE_FORM.md).'
        alertBox.hidden = false
        return
      }

      var f = cfg.googleForm.fields
      var body = new URLSearchParams()
      body.append(f.parentName, values.parentName)
      body.append(f.contact, parseContact(values.contact))
      body.append(f.email, values.email.toLowerCase())
      body.append(f.grade, values.grade)
      body.append(f.level, values.level || 'Не знаю')
      body.append(f.goal, values.goal)
      body.append(f.schedule, values.schedule.join(', ') || 'Не указано')
      body.append(f.timezone, values.timezone)
      body.append(f.comment, values.comment)
      body.append(
        f.consent,
        'Да — версия «' + (cfg.consentVersion || 'не указана') + '», ' + new Date().toLocaleString('ru-RU'),
      )
      body.append(f.source, attributionString())

      button.disabled = true
      button.textContent = 'Отправляем…'
      var controller = 'AbortController' in window ? new AbortController() : null
      var timer = setTimeout(function () {
        if (controller) controller.abort()
      }, 15000)

      // Google Forms не отдаёт ответ чужим сайтам (no-cors), поэтому успехом считаем доставку запроса.
      // Чтобы Google не отклонял ответы, все вопросы формы — текстовые (см. docs/GOOGLE_FORM.md).
      fetch(cfg.googleForm.action, {
        method: 'POST',
        mode: 'no-cors',
        body: body,
        signal: controller ? controller.signal : undefined,
      })
        .then(function () {
          track('form_complete', { level: values.level || 'не выбран', goal: values.goal, class: values.grade })
          storage.remove(DRAFT_KEY)
          showSuccess()
        })
        .catch(function () {
          alertBox.textContent = 'Не получилось отправить — проверьте интернет и попробуйте ещё раз. Данные остались в форме.'
          alertBox.hidden = false
        })
        .then(function () {
          clearTimeout(timer)
          button.disabled = false
          button.textContent = 'Отправить заявку'
        })
    })

    var again = $('[data-new-lead]')
    if (again) {
      again.addEventListener('click', function () {
        form.reset()
        detectTimezone(form)
        syncChoices(form)
        startedAt = Date.now()
        success.hidden = true
        form.hidden = false
        form.elements.parentName.focus()
      })
    }
  }

  // ---------------------------------------------------------------------------

  captureAttribution()
  initContent()
  initMenu()
  initStickyCta()
  initTracking()
  initForm()
  initAnalytics()

  // Для автотестов
  window.__mkm = { parseContact: parseContact, formConfigured: formConfigured }
})()
