'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'

import type { EventName, EventParams } from '@/lib/analytics-events'

import { track } from './track'

type Props = ComponentProps<typeof Link> & {
  event: EventName
  params?: EventParams
  external?: boolean
}

/** Ссылка, которая отправляет событие аналитики при клике. */
export function TrackedLink({ event, params, external, onClick, href, children, ...rest }: Props) {
  const handleClick: Props['onClick'] = (e) => {
    track(event, params)
    onClick?.(e)
  }

  if (external) {
    return (
      <a href={String(href)} target="_blank" rel="noopener noreferrer" onClick={handleClick} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
