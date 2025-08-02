import React, { ButtonHTMLAttributes, forwardRef, memo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'touch-target inline-flex items-center justify-center rounded-[2.5rem] font-bold transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-primary to-primary-400 text-white hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[0_3px_0_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.1)] active:translate-y-[3px]',
        secondary: 'bg-gradient-to-r from-candy-blue to-candy-mint text-gray-800 hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.08)] active:shadow-[0_3px_0_rgba(0,0,0,0.1),0_5px_10px_rgba(0,0,0,0.08)] active:translate-y-[3px]',
        destructive: 'bg-gradient-to-r from-red-500 to-candy-coral text-white hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[0_3px_0_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.1)] active:translate-y-[3px]',
        outline: 'border-2 border-candy-purple bg-white hover:bg-candy-purple/10 text-candy-purple shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-[0_2px_0_rgba(0,0,0,0.1)] active:translate-y-[2px]',
        ghost: 'hover:bg-candy-purple/10 text-candy-purple',
        link: 'text-primary underline-offset-4 hover:underline',
        'stat-health': 'bg-gradient-to-r from-stat-healthStart to-stat-healthEnd text-white hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[0_3px_0_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.1)] active:translate-y-[3px] animate-float',
        'stat-learning': 'bg-gradient-to-r from-stat-learningStart to-stat-learningEnd text-white hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[0_3px_0_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.1)] active:translate-y-[3px] animate-float',
        'stat-relationship': 'bg-gradient-to-r from-stat-relationshipStart to-stat-relationshipEnd text-white hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[0_3px_0_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.1)] active:translate-y-[3px] animate-float',
        'stat-achievement': 'bg-gradient-to-r from-stat-achievementStart to-stat-achievementEnd text-white hover:shadow-lg shadow-[0_6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[0_3px_0_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.1)] active:translate-y-[3px] animate-float'
      },
      size: {
        sm: 'h-12 px-6 text-base',
        md: 'h-14 px-8 text-lg',
        lg: 'h-16 px-10 text-xl',
        xl: 'h-20 px-12 text-2xl',
        icon: 'h-14 w-14',
        'icon-lg': 'h-16 w-16'
      },
      fullWidth: {
        true: 'w-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, onClick, ...props }, ref) => {
      const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
        // 터치/클릭 즉시 반응
        if (onClick && !props.disabled) {
          e.preventDefault()
          // PointerEvent를 MouseEvent처럼 처리
          const mouseEvent = e as unknown as React.MouseEvent<HTMLButtonElement>
          onClick(mouseEvent)
        }
      }

      return (
        <button
          className={cn(buttonVariants({ variant, size, fullWidth }), 'touch-active', className)}
          ref={ref}
          onPointerDown={handlePointerDown}
          {...props}
        />
      )
    }
  )
)

Button.displayName = 'Button'

export { Button, buttonVariants }
