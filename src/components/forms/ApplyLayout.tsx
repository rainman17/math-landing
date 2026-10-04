import type { ReactNode } from 'react'

import { Header } from '@/components/layout/Header'
import type { ApplyForm, SiteSetting } from '@/payload-types'

/** Общий каркас экранов заявки: прогресс, форма и колонка «что будет дальше». */
export function ApplyLayout({
  settings,
  applyForm,
  step,
  children,
}: {
  settings: SiteSetting
  applyForm: ApplyForm
  step: 1 | 2
  children: ReactNode
}) {
  return (
    <>
      <Header
        variant="minimal"
        brandName={settings.brandName}
        telegramUrl={settings.telegramUrl}
        telegramLabel={settings.telegramLabel}
      />
      <main id="main" className="apply-page">
        <div className="container">
          <div className="progress" role="group" aria-label={`Шаг ${step} из 2`}>
            <div className="progress-bar" aria-hidden="true">
              <span style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>
            <p className="progress-label">Шаг {step} из 2</p>
          </div>
          <div className="apply-grid">
            <div className="apply-main">{children}</div>
            {applyForm.nextSteps && applyForm.nextSteps.length > 0 && (
              <aside className="apply-aside" aria-labelledby="next-steps-title">
                <p id="next-steps-title" className="eyebrow">
                  Что будет дальше
                </p>
                <ol className="aside-steps">
                  {applyForm.nextSteps.map((item, index) => (
                    <li key={item.id ?? index}>
                      <span className="aside-num" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div>
                        <p className="aside-title">{item.title}</p>
                        {item.text && <p className="aside-text">{item.text}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                {settings.responseTime && <p className="aside-note">Срок ответа: {settings.responseTime}</p>}
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
