'use client'

import Link from 'next/link'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="apply-page">
      <div className="container legal-container">
        <h1 className="apply-title">Что-то пошло не так</h1>
        <p className="apply-lead">Страница не загрузилась. Попробуйте ещё раз через минуту.</p>
        <div className="success-actions">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Обновить
          </button>
          <Link href="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </main>
  )
}
