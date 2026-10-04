import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="apply-page">
      <div className="container legal-container">
        <p className="eyebrow">Ошибка 404</p>
        <h1 className="apply-title">Такой страницы нет</h1>
        <p className="apply-lead">Возможно, ссылка устарела. Вся информация о курсе — на главной странице.</p>
        <div className="success-actions">
          <Link href="/" className="btn btn-primary">
            На главную
          </Link>
          <Link href="/apply" className="btn btn-secondary">
            Подобрать группу
          </Link>
        </div>
      </div>
    </main>
  )
}
