import { Fragment } from 'react'

/** Текст из админки, где фрагменты в `обратных кавычках` набираются математическим шрифтом. */
export function MathText({ text }: { text?: string | null }) {
  if (!text) return null
  const parts = text.split('`')
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="math">
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}
