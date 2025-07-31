import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export const LockClosed: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
    />
  </svg>
)