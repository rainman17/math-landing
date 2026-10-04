import type { Landing } from '@/payload-types'

const SEQUENCE = [2, 4, 6, 8]

/** Карточка «Математическая мастерская»: одна закономерность в трёх представлениях. */
export function HeroVisual({ visual }: { visual: Landing['hero']['visual'] }) {
  return (
    <figure className="workshop">
      <figcaption className="workshop-head">
        {visual?.eyebrow && <span className="eyebrow">{visual.eyebrow}</span>}
        {visual?.title && <span className="workshop-title">{visual.title}</span>}
        {visual?.text && <span className="workshop-text">{visual.text}</span>}
      </figcaption>

      <div
        className="workshop-board"
        role="img"
        aria-label="Ряд 2, 4, 6, 8; модель — столбики из двух, четырёх, шести и восьми клеток; формула: n шагов — 2n плиток"
      >
        <div className="wk-row">
          <span className="wk-label">ряд</span>
          <div className="wk-cells">
            {SEQUENCE.map((value, index) => (
              <span key={value} className="wk-cell" style={{ animationDelay: `${index * 80}ms` }}>
                {value}
              </span>
            ))}
            <span className="wk-cell wk-cell--next">?</span>
          </div>
        </div>

        <div className="wk-row">
          <span className="wk-label">модель</span>
          <div className="wk-model">
            {SEQUENCE.map((value, index) => (
              <span key={value} className="wk-stack" style={{ animationDelay: `${250 + index * 80}ms` }}>
                {Array.from({ length: value }, (_, cell) => (
                  <i key={cell} />
                ))}
              </span>
            ))}
          </div>
        </div>

        <div className="wk-row">
          <span className="wk-label">формула</span>
          <p className="wk-formula">
            <span className="math">n</span> шагов <span aria-hidden="true">→</span> <span className="math">2n</span> плиток
          </p>
        </div>
      </div>

      <p className="wk-legend" aria-hidden="true">
        <span>ряд</span>
        <span className="wk-arrow">→</span>
        <span>модель</span>
        <span className="wk-arrow">→</span>
        <span>формула</span>
      </p>
    </figure>
  )
}
