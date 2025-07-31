// Framer Motion 최적화된 import
// tree shaking을 위해 필요한 것만 import

export { motion, AnimatePresence } from 'framer-motion/dist/framer-motion'

// 기본 애니메이션 설정
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

// 기본 transition
export const defaultTransition = {
  duration: 0.3,
  ease: "easeInOut"
}