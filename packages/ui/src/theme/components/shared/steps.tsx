import { match, P } from 'massaman/match'
import React from 'react'

import { Icon } from './icon'

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export interface StepsProps {
  /**
   * Heading level for step titles.
   */
  readonly titleSize?: 'h2' | 'h3' | 'p'
  /**
   * Step children to render in a vertical timeline.
   */
  readonly children: React.ReactNode
}

/**
 * Vertical timeline stepper that renders numbered Step children
 * with connecting lines between them.
 *
 * @param props - Steps configuration with optional title size
 * @returns React element wrapping Step children in a timeline layout
 */
export function Steps({ titleSize = 'h3', children }: StepsProps): React.ReactElement {
  const mapped = React.Children.map(children, (child, index) =>
    match(child)
      .with(
        P.when((c): c is React.ReactElement => React.isValidElement(c)),
        (el) => React.cloneElement(el, { stepNumber: index + 1, titleSize } as Partial<StepProps>)
      )
      .otherwise(() => child)
  )

  return <div className="cp-steps">{mapped}</div>
}

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------

export interface StepProps {
  /**
   * Title displayed next to the step indicator.
   */
  readonly title: string
  /**
   * Optional Iconify icon ID that replaces the step number in the circle.
   */
  readonly icon?: string
  /**
   * Explicit step number override. Injected automatically by Steps.
   */
  readonly stepNumber?: number
  /**
   * Heading level for the title. Injected automatically by Steps.
   */
  readonly titleSize?: 'h2' | 'h3' | 'p'
  /**
   * Arbitrary MDX content for this step.
   */
  readonly children: React.ReactNode
}

/**
 * Individual step within a Steps timeline, rendering a numbered circle
 * indicator (or icon), connecting line, title, and body content.
 *
 * @param props - Step configuration with title, optional icon, and content
 * @returns React element for a single timeline step
 */
export function Step({
  title,
  icon,
  stepNumber = 1,
  titleSize = 'h3',
  children,
}: StepProps): React.ReactElement {
  const indicator = match(icon)
    .with(P.nonNullable, (i) => (
      <span className="cp-step__indicator">
        <Icon icon={i} />
      </span>
    ))
    .otherwise(() => <span className="cp-step__indicator">{stepNumber}</span>)

  const titleEl = match(titleSize)
    .with('h2', () => <h2 className="cp-step__title">{title}</h2>)
    .with('h3', () => <h3 className="cp-step__title">{title}</h3>)
    .with('p', () => <p className="cp-step__title">{title}</p>)
    .exhaustive()

  return (
    <div className="cp-step">
      <div className="cp-step__rail">
        {indicator}
        <div className="cp-step__connector" />
      </div>
      <div className="cp-step__body">
        {titleEl}
        <div className="cp-step__content">{children}</div>
      </div>
    </div>
  )
}
