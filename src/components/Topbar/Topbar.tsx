import React from 'react'
import { clsx } from 'clsx'
import { Search } from '../ui/Search'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Tooltip } from '../ui/Tooltip'

interface TopbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  notifications?: {
    count: number
    onClick: () => void
  }
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  onUserClick?: () => void
  onToggleSidebar?: () => void
  className?: string
}

export const Topbar: React.FC<TopbarProps> = ({
  searchValue,
  onSearchChange,
  notifications,
  user,
  onUserClick,
  onToggleSidebar,
  className,
}) => {
  return (
    <header
      className={clsx(
        'sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border-light',
        'flex items-center justify-between px-4 lg:px-6',
        className
      )}
    >
      {/* Left Section: Sidebar Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        {/* Sidebar Toggle (Desktop) */}
        <Tooltip content="Toggle Sidebar" position="bottom">
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 text-muted hover:bg-hover hover:text-foreground rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </Tooltip>

        {/* Search Bar */}
        <div className="w-full max-w-md">
          <Search
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search anything..."
            className="w-full"
          />
        </div>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        {notifications && (
          <Tooltip content="Notifications" position="bottom">
            <button
              onClick={notifications.onClick}
              className="relative p-2 text-muted hover:bg-hover hover:text-foreground rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {notifications.count > 0 && (
                <Badge
                  variant="danger"
                  size="sm"
                  className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs"
                >
                  {notifications.count > 99 ? '99+' : notifications.count}
                </Badge>
              )}
            </button>
          </Tooltip>
        )}

        {/* Divider */}
        <div className="hidden lg:block w-px h-6 bg-border-light" />

        {/* Profile */}
        <button
          onClick={onUserClick}
          className="flex items-center gap-2 lg:gap-3 p-1 pr-2 lg:pr-3 rounded-lg hover:bg-hover transition-colors"
        >
          <Avatar
            name={user?.name}
            src={user?.avatar}
            size="md"
            status="online"
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
          <svg
            className="hidden lg:block w-4 h-4 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  )
}
