'use client'

import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

// 모든 아이콘을 정적으로 import
import {
  Home,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Plus,
  Minus,
  Sword,
  Shield,
  Heart,
  Brain,
  Users,
  Trophy,
  Zap,
  Star,
  Sparkles,
  Flame,
  Book,
  Calendar,
  Clock,
  Gift,
  Coins,
  Gem,
  Scroll,
  ShoppingBag,
  Package,
  Target,
  Award,
  Activity,
  BarChart,
  TrendingUp,
  Map,
  Compass,
  Mountain,
  Trees,
  Swords,
  Gamepad2,
  Crown,
  Medal,
  Dumbbell,
  Briefcase,
  MessageCircle,
  Send,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Music,
  Mic,
  Camera,
  Image,
  FileText,
  Save,
  Download,
  Upload,
  RefreshCw,
  RotateCw,
  Loader2,
  AlertCircle,
  Info,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

// 아이콘 맵
const iconMap = {
  home: Home,
  user: User,
  settings: Settings,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  x: X,
  check: Check,
  plus: Plus,
  minus: Minus,
  sword: Sword,
  shield: Shield,
  heart: Heart,
  brain: Brain,
  users: Users,
  trophy: Trophy,
  zap: Zap,
  star: Star,
  sparkles: Sparkles,
  flame: Flame,
  book: Book,
  calendar: Calendar,
  clock: Clock,
  gift: Gift,
  coins: Coins,
  gem: Gem,
  scroll: Scroll,
  'shopping-bag': ShoppingBag,
  package: Package,
  target: Target,
  award: Award,
  activity: Activity,
  'bar-chart': BarChart,
  'trending-up': TrendingUp,
  map: Map,
  compass: Compass,
  mountain: Mountain,
  trees: Trees,
  swords: Swords,
  gamepad2: Gamepad2,
  crown: Crown,
  medal: Medal,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  send: Send,
  bell: Bell,
  'bell-ring': BellRing,
  volume2: Volume2,
  'volume-x': VolumeX,
  music: Music,
  mic: Mic,
  camera: Camera,
  image: Image,
  'file-text': FileText,
  save: Save,
  download: Download,
  upload: Upload,
  'refresh-cw': RefreshCw,
  'rotate-cw': RotateCw,
  loader2: Loader2,
  'alert-circle': AlertCircle,
  info: Info,
  'help-circle': HelpCircle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle
} as const

export type IconName = keyof typeof iconMap

interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  const IconComponent = iconMap[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  return <IconComponent size={size} {...props} />
}

// 타입 안전성을 위한 helper
export function getIcon(name: IconName): LucideIcon | null {
  return iconMap[name] || null
}