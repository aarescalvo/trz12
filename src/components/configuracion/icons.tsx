// Re-export lucide icons used in personalization
import { 
  Settings, GripVertical, Eye, EyeOff, Palette, RotateCcw, Save,
  Monitor, Moon, Sun, Layout, ChevronDown
} from 'lucide-react'

// Create Size components
const Small = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="10" height="10" rx="1" />
  </svg>
)

const Medium = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="14" height="10" rx="1" />
  </svg>
)

const Large = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="1" width="14" height="14" rx="1" />
  </svg>
)

export {
  Settings,
  GripVertical,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Save,
  Monitor,
  Moon,
  Sun,
  Layout,
  ChevronDown,
  Small,
  Medium,
  Large
}
