'use client'

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type BaseProps = {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
}

const describedBy = (id: string, hint?: ReactNode, error?: string) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} className="field-error">
      <span aria-hidden="true">⚠</span> {error}
    </p>
  )
}

function Label({ id, label, required }: Pick<BaseProps, 'id' | 'label' | 'required'>) {
  return (
    <label htmlFor={id} className="field-label">
      {label}
      {required ? (
        <span className="field-required" aria-hidden="true">
          {' '}
          *
        </span>
      ) : (
        <span className="field-optional"> — необязательно</span>
      )}
    </label>
  )
}

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  ...input
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <Label id={id} label={label} required={required} />
      <input
        id={id}
        name={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <FieldError id={id} error={error} />
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  required,
  ...input
}: BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <Label id={id} label={label} required={required} />
      <textarea
        id={id}
        name={id}
        className="input textarea"
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <FieldError id={id} error={error} />
    </div>
  )
}

type Choice<T extends string | number> = { value: T; label: string; hint?: string }

/** Группа выбора в виде карточек: radio (один вариант) или checkbox (несколько). */
export function ChoiceGroup<T extends string | number>({
  id,
  legend,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  multiple = false,
  variant = 'cards',
}: {
  id: string
  legend: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  options: Choice<T>[]
  value: T | T[] | undefined
  onChange: (value: T | T[]) => void
  multiple?: boolean
  variant?: 'cards' | 'segmented'
}) {
  const selected = (option: T) => (Array.isArray(value) ? value.includes(option) : value === option)
  const toggle = (option: T) => {
    if (!multiple) return onChange(option)
    const current = Array.isArray(value) ? value : []
    onChange(current.includes(option) ? current.filter((item) => item !== option) : [...current, option])
  }

  return (
    <fieldset
      id={id}
      className={`field choice-group${error ? ' has-error' : ''}`}
      aria-describedby={describedBy(id, hint, error)}
      aria-invalid={error ? true : undefined}
      tabIndex={-1}
    >
      <legend className="field-label">
        {legend}
        {required ? (
          <span className="field-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <div className={`choices choices--${variant}`}>
        {options.map((option) => {
          const inputId = `${id}-${option.value}`
          return (
            <label key={String(option.value)} htmlFor={inputId} className={`choice${selected(option.value) ? ' is-selected' : ''}`}>
              <input
                id={inputId}
                type={multiple ? 'checkbox' : 'radio'}
                name={id}
                value={String(option.value)}
                checked={selected(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span className="choice-label">{option.label}</span>
              {option.hint && <span className="choice-hint">{option.hint}</span>}
            </label>
          )
        })}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  )
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  error,
  required,
}: {
  id: string
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  required?: boolean
}) {
  return (
    <div className={`field checkbox-field${error ? ' has-error' : ''}`}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      <FieldError id={id} error={error} />
    </div>
  )
}

export function FormAlert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  if (!children) return null
  return (
    <div className={`form-alert form-alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

/** Переводит фокус к первому полю с ошибкой — для клавиатуры и экранных читалок. */
export function focusFirstError(errors: Record<string, string>, order: string[]) {
  const first = order.find((key) => errors[key])
  if (!first) return
  requestAnimationFrame(() => {
    const element = document.getElementById(first)
    element?.focus()
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}
