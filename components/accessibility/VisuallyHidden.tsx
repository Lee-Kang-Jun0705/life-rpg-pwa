import React, { ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  as?: keyof React.JSX.IntrinsicElements
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component
      className="
        absolute w-[1px] h-[1px] p-0 -m-[1px]
        overflow-hidden whitespace-nowrap
        border-0
      "
      style={{
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)'
      }}
    >
      {children}
    </Component>
  )
}
