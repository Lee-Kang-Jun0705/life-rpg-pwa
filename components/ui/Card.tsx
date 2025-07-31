import React, { HTMLAttributes, forwardRef, memo } from 'react'
import { cn } from '@/lib/utils'

const Card = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          'rounded-[2rem] border-0 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md text-card-foreground shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)] hover:translate-y-[-5px] hover:scale-[1.02] animate-bounce-in',
          'dark:from-gray-800/90 dark:to-gray-900/70',
          className
        )}
        {...props}
      />
    )
  )
)
Card.displayName = 'Card'

const CardHeader = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-2 p-8', className)}
        {...props}
      />
    )
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = memo(
  forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    )
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = memo(
  forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    )
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn('p-8 pt-0', className)} {...props} />
    )
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('flex items-center p-8 pt-0', className)}
        {...props}
      />
    )
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }