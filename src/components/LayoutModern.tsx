import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '../store/AuthContext'
import { useSchoolStore } from '../store/schoolStore'
import { useTranslation } from '../hooks/useTranslation'

// Import icons
const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
const AnalyticsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
const TeachersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
const ClassesIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
const StudentsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
const AttendanceIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
const GradesIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41z"/></svg>
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>

const LayoutModern: React.FC = () => {
  const { user, logout } = useAuth()
  const { schoolName, logo, academicYear } = useSchoolStore()
  const { t, dir } = useTranslation()
  const navigate = useNavigate()
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    // Implement search functionality here
    console.log('Search:', value)
  }

  const handleNotificationClick = () => {
    console.log('Notifications clicked')
  }

  const handleUserClick = () => {
    console.log('User menu clicked')
  }

  // Menu configuration
  const menuGroups = [
    {
      title: t('nav.general') || 'General',
      items: [
        { path: '/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: <DashboardIcon /> },
        { path: '/analytics', label: t('nav.analytics') || 'Analytics', icon: <AnalyticsIcon /> },
      ]
    },
    {
      title: t('nav.academic') || 'Academic',
      items: [
        { path: '/teachers', label: t('nav.teachers') || 'Teachers', icon: <TeachersIcon /> },
        { path: '/classes', label: t('nav.classes') || 'Classes', icon: <ClassesIcon /> },
        { path: '/students', label: t('nav.students') || 'Students', icon: <StudentsIcon /> },
        { path: '/attendance', label: t('nav.attendance') || 'Attendance', icon: <AttendanceIcon /> },
        { path: '/grades', label: t('nav.grades') || 'Grades', icon: <GradesIcon /> },
      ]
    },
    {
      title: t('nav.system') || 'System',
      items: [
        { path: '/settings', label: t('nav.settings') || 'Settings', icon: <SettingsIcon /> },
      ]
    }
  ]

  return (
    <div className={clsx('min-h-screen bg-bg', darkMode && 'dark')}>
      {/* Sidebar */}
      <Sidebar
        menuGroups={menuGroups}
        schoolName={schoolName}
        schoolLogo={logo}
        academicYear={academicYear}
        user={{
          name: user?.displayName || user?.email,
          email: user?.email,
        }}
        onLogout={handleLogout}
        onSettings={handleSettings}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        className={clsx(sidebarCollapsed && 'lg:w-[70px]')}
      />

      {/* Main Content Area */}
      <div
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[280px]'
        )}
      >
        {/* Topbar */}
        <Topbar
          searchValue={searchValue}
          onSearchChange={handleSearch}
          notifications={{
            count: 3,
            onClick: handleNotificationClick,
          }}
          user={{
            name: user?.displayName || user?.email,
            email: user?.email,
          }}
          onUserClick={handleUserClick}
          onToggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-border-light">
          <p className="text-sm text-muted text-center">
            © {new Date().getFullYear()} School Management System. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default LayoutModern
