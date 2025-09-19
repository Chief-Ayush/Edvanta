import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  Palette,
  MessageSquare,
  Brain,
  Mic,
  MapPin,
  FileText,
  Trophy,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Visual Generator', href: '/tools/visual-generator', icon: Palette },
  { name: 'Doubt Solving', href: '/tools/doubt-solving', icon: MessageSquare },
  { name: 'Quizzes', href: '/tools/quizzes', icon: Brain },
  { name: 'Voice Tutor', href: '/tools/conversational-tutor', icon: Mic },
  { name: 'Roadmap', href: '/tools/roadmap', icon: MapPin },
  { name: 'Resume Builder', href: '/tools/resume-builder', icon: FileText },
  { name: 'Offline Mode', href: '/offline-dashboard', icon: WifiOff, badge: 'PWA' },
]

export function Sidebar({ className }) {
  const location = useLocation()

  return (
    <aside className={cn("hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen shadow-sm pt-16 fixed left-0 top-0 z-10", className)}>
      <div className="p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 md:mb-6">
          Learning Tools
        </h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
                )} />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}