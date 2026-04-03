// src/components/DashboardV3.tsx - MyCloud Style Dashboard

import React, { useMemo, useState } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useStudents } from '../store/studentsStore'
import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import './DashboardV3.css'

const DashboardV3: React.FC = () => {
  const { teachers, classes, salles, students, timetables } = useSchoolStore()
  const currentStudents = useStudents()
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeNav, setActiveNav] = useState('dashboard')

  // Statistics
  const stats = useMemo(() => ({
    teachers: teachers.length,
    classes: classes.length,
    salles: salles.length,
    students: currentStudents.length,
    totalCapacity: 1000 // Mock capacity
  }), [teachers, classes, salles, currentStudents])

  // Calculate usage percentage
  const usagePercentage = Math.min((stats.students / stats.totalCapacity) * 100, 100)

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', link: '/dashboard' },
    { id: 'teachers', icon: '👨‍🏫', label: 'Teachers', link: '/teachers' },
    { id: 'classes', icon: '📚', label: 'Classes', link: '/classes' },
    { id: 'students', icon: '👨‍🎓', label: 'Students', link: '/students' },
    { id: 'timetable', icon: '📅', label: 'Timetable', link: '/timetable' },
    { id: 'shared', icon: '👥', label: 'Shared', link: '/shared' },
    { id: 'recent', icon: '🕐', label: 'Recent', link: '/recent' },
    { id: 'starred', icon: '⭐', label: 'Starred', link: '/starred' },
  ]

  // Quick access items
  const quickAccess = [
    {
      id: 1,
      type: 'folder',
      title: 'All Classes',
      subtitle: `${stats.classes} classes`,
      icon: '📚',
      color: 'green',
      link: '/classes',
      avatars: []
    },
    {
      id: 2,
      type: 'file',
      title: 'Teachers List',
      subtitle: `${stats.teachers} teachers`,
      icon: '👨‍🏫',
      color: 'red',
      link: '/teachers',
      avatars: []
    },
    {
      id: 3,
      type: 'file',
      title: 'Students Database',
      subtitle: `${stats.students} students`,
      icon: '📄',
      color: 'blue',
      link: '/students',
      avatars: []
    }
  ]

  // Folders
  const folders = [
    {
      id: 1,
      name: 'Teachers',
      count: stats.teachers,
      size: `${(stats.teachers * 2.5).toFixed(1)} MB`,
      icon: '👨‍',
      link: '/teachers'
    },
    {
      id: 2,
      name: 'Classes',
      count: stats.classes,
      size: `${(stats.classes * 5.2).toFixed(1)} MB`,
      icon: '📚',
      link: '/classes'
    },
    {
      id: 3,
      name: 'Students',
      count: stats.students,
      size: `${(stats.students * 1.8).toFixed(1)} MB`,
      icon: '👨‍🎓',
      link: '/students'
    },
    {
      id: 4,
      name: 'Salles',
      count: stats.salles,
      size: `${(stats.salles * 1.2).toFixed(1)} MB`,
      icon: '🏫',
      link: '/salles'
    }
  ]

  // Recent files (mock data based on activities)
  const recentFiles = [
    {
      id: 1,
      name: 'Class Schedule 2025',
      type: 'pdf',
      modified: 'Nov 15, 2025 | 14:30',
      members: 'All teachers',
      icon: '📄'
    },
    {
      id: 2,
      name: 'Student Grades Report',
      type: 'xlsx',
      modified: 'Nov 14, 2025 | 10:15',
      members: `${stats.teachers} members`,
      icon: '📊'
    },
    {
      id: 3,
      name: 'Attendance Summary',
      type: 'pdf',
      modified: 'Nov 13, 2025 | 16:45',
      members: 'Admin only',
      icon: '📋'
    },
    {
      id: 4,
      name: 'Teacher Assignments',
      type: 'doc',
      modified: 'Nov 12, 2025 | 09:20',
      members: `${stats.classes} classes`,
      icon: '📝'
    }
  ]

  // Stats breakdown
  const statsBreakdown = [
    { label: 'Teachers', count: stats.teachers, size: `${(stats.teachers * 2.5).toFixed(1)} MB`, color: '#FF6B6B', icon: '👨‍🏫' },
    { label: 'Students', count: stats.students, size: `${(stats.students * 1.8).toFixed(1)} MB`, color: '#48C9A8', icon: '👨‍🎓' },
    { label: 'Classes', count: stats.classes, size: `${(stats.classes * 5.2).toFixed(1)} MB`, color: '#FFA502', icon: '📚' },
    { label: 'Salles', count: stats.salles, size: `${(stats.salles * 1.2).toFixed(1)} MB`, color: '#4ECDC4', icon: '🏫' }
  ]

  // Gauge chart segments (for semi-circle)
  const gaugeSegments = [
    { color: '#FF6B6B', start: 0, end: 25 },
    { color: '#FFA502', start: 25, end: 50 },
    { color: '#FFD93D', start: 50, end: 75 },
    { color: '#48C9A8', start: 75, end: 100 }
  ]

  return (
    <div className="dashboard-v3">
      {/* Left Sidebar */}
      <aside className="sidebar-v3">
        <div className="sidebar-top">
          <div className="logo-section">
            <div className="logo-icon">☁️</div>
            <span className="logo-text">School Cloud</span>
          </div>

          <button className="create-new-btn">
            <span>➕</span> Create New
          </button>

          <nav className="sidebar-nav">
            <div className="nav-section-title">My Files</div>
            {navItems.slice(0, 5).map((item) => (
              <Link
                to={item.link}
                key={item.id}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <nav className="sidebar-nav bottom">
          {navItems.slice(5).map((item) => (
            <Link
              to={item.link}
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          
          <div className="nav-spacer" />
          
          <Link to="/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content-v3">
        {/* Search Bar */}
        <div className="search-bar-container">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search your files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Access */}
        <section className="content-section">
          <h2 className="section-title">Quick Access</h2>
          <div className="quick-access-grid">
            {quickAccess.map((item) => (
              <Link to={item.link} key={item.id} className={`quick-access-card ${item.color}`}>
                <div className="quick-access-icon">
                  <span className="icon-emoji">{item.icon}</span>
                  {item.avatars.length > 0 && (
                    <div className="avatars-badge">+{item.avatars.length}</div>
                  )}
                </div>
                <div className="quick-access-info">
                  <span className="quick-access-title">{item.title}</span>
                  <span className="quick-access-subtitle">{item.subtitle}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Folders */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Folders</h2>
            <Link to="/all-folders" className="view-all-link">→</Link>
          </div>
          <div className="folders-grid">
            {folders.map((folder) => (
              <Link to={folder.link} key={folder.id} className="folder-card">
                <div className="folder-header">
                  <span className="folder-icon">{folder.icon}</span>
                  <button className="folder-menu">⋮</button>
                </div>
                <div className="folder-info">
                  <span className="folder-name">{folder.name}</span>
                  <span className="folder-details">
                    {folder.count} files · <strong>{folder.size}</strong>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Files */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Files</h2>
            <Link to="/recent" className="view-all-link">→</Link>
          </div>
          <div className="recent-files-table">
            <div className="table-header">
              <span className="col-name">Name</span>
              <span className="col-modified">Last modified</span>
              <span className="col-members">Member</span>
              <span className="col-actions"></span>
            </div>
            {recentFiles.map((file) => (
              <div key={file.id} className="table-row">
                <div className="col-name">
                  <span className="file-icon">{file.icon}</span>
                  <span className="file-name">{file.name}</span>
                </div>
                <span className="col-modified">{file.modified}</span>
                <span className="col-members">{file.members}</span>
                <button className="col-actions">⋮</button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Right Panel */}
      <aside className="right-panel-v3">
        {/* User Greeting */}
        <div className="user-greeting">
          <button className="notification-btn">
            🔔
            <span className="notification-dot" />
          </button>
          <span className="greeting-text">Hi, Admin</span>
          <div className="profile-avatar">
            <img src="https://ui-avatars.com/api/?name=Admin&background=48C9A8&color=fff" alt="Profile" />
          </div>
        </div>

        {/* Gauge Chart */}
        <div className="gauge-card">
          <div className="gauge-chart">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#E8E8E8"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {/* Colored segments */}
              {gaugeSegments.map((segment, index) => (
                <path
                  key={index}
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${(segment.end - segment.start) * 2.51} 251`}
                  strokeDashoffset={`${251 - segment.start * 2.51}`}
                  opacity={usagePercentage > segment.start ? 1 : 0.3}
                />
              ))}
              {/* Current value indicator */}
              <circle
                cx={20 + (usagePercentage / 100) * 160}
                cy={100 - Math.sin((usagePercentage / 100) * Math.PI) * 80}
                r="8"
                fill="#2D3436"
              />
            </svg>
            <div className="gauge-value">
              <span className="value-number">{stats.students}</span>
              <span className="value-label">of {stats.totalCapacity} capacity</span>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="stats-breakdown">
            {statsBreakdown.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-left">
                  <span className="stat-icon-bg" style={{ background: `${stat.color}20` }}>
                    {stat.icon}
                  </span>
                  <div className="stat-info">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-count">{stat.count} files</span>
                  </div>
                </div>
                <span className="stat-size">{stat.size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="upgrade-card">
          <div className="upgrade-illustration">
            <span className="illustration-icon">🔒</span>
          </div>
          <h3 className="upgrade-title">Upgrade to PRO</h3>
          <p className="upgrade-subtitle">
            Get more space for your storage and access to all features
          </p>
          <button className="upgrade-btn">Upgrade Now</button>
        </div>
      </aside>
    </div>
  )
}

export default DashboardV3
