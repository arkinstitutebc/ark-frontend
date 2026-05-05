import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Lock,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  User,
  Users,
} from "lucide-solid"

// Portal icons for dashboard cards
export const PortalIcons = {
  batches: Folder,
  students: Users,
  procurement: FileText,
  inventory: Package,
  finance: DollarSign,
  billing: FileText,
  hr: Users,
} as const

// UI icons
export const UI = {
  arrowRight: ArrowRight,
  logout: LogOut,
  menu: Menu,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  alert: AlertTriangle,
  settings: Settings,
  chevronDown: ChevronDown,
  user: User,
  bell: Bell,
  calendar: Calendar,
  clock: Clock,
} as const
