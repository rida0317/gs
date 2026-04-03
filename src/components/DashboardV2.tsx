// src/components/DashboardV2.tsx - Clean My Mac Style Dashboard

import React, { useMemo, useState } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useStudents } from '../store/studentsStore'
import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import './DashboardV2.css'

const DashboardV2: React.FC = () => {
  const { teachers, classes, salles, students, timetables } = useSchoolStore()
  const currentStudents = useStudents()
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<number>(5)

  // Statistics
  const stats = useMemo(() => ({
    teachers: teachers.length,
    classes: classes.length,
    salles: salles.length,
    students: currentStudents.length
  }), [teachers, classes, salles, currentStudents])

  // Weekly data for calendar strip
  const weekDays = [
    { day: 'Mon', date: 2 },
    { day: 'Tue', date: 3 },
    { day: 'Wed', date: 4 },
    { day: 'Thu', date: 5 },
    { day: 'Fri', date: 6 },
    { day: 'Sat', date: 7 },
    { day: 'Sun', date: 8 }
  ]

  // Stats cards data
  const statsCards = [
    { 
      id: 'teachers',
      label: t('nav.teachers'),
      value: stats.teachers,
      icon: '👨‍🏫',
      color: 'orange',
      link: '/teachers'
    },
    { 
      id: 'classes',
      label: t('nav.classes'),
      value: stats.classes,
      icon: '📚',
      color: 'pink',
      link: '/classes'
    },
    { 
      id: 'salles',
      label: t('nav.salles'),
      value: stats.salles,
      icon: '🏫',
      color: 'blue',
      link: '/salles'
    },
    { 
      id: 'students',
      label: t('nav.students'),
      value: stats.students,
      icon: '👨‍🎓',
      color: 'purple',
      link: '/students'
    }
  ]

  // Progress data
  const progressData = [
    { label: 'System Files', date: 'December 2019', value: 25, color: '#FF6B6B' },
    { label: 'Applications', date: 'December 2019', value: 50, color: '#FF9F43', dark: true }
  ]

  // Other functions
  const otherFunctions = [
    { id: 1, label: 'Optimization', icon: '📊', color: 'pink', enabled: true },
    { id: 2, label: 'Smart Scan', icon: '🔍', color: 'orange', enabled: true },
    { id: 3, label: 'Malware', icon: '🛡️', color: 'blue', enabled: true },
    { id: 4, label: 'Updater', icon: '🔄', color: 'purple', enabled: false }
  ]

  // Weekly chart data
  const weeklyChartData = [
    { day: 'MO', value: 65 },
    { day: 'TU', value: 45 },
    { day: 'WE', value: 78 },
    { day: 'TH', value: 52 },
    { day: 'FR', value: 89 },
    { day: 'SA', value: 34 },
    { day: 'SU', value: 23 }
  ]

  // Resource distribution for pie chart
  const resourceData = [
    { name: 'Teachers', value: stats.teachers, color: '#FF9F43' },
    { name: 'Classes', value: stats.classes, color: '#FF6B6B' },
    { name: 'Salles', value: stats.salles, color: '#4ECDC4' },
    { name: 'Students', value: stats.students, color: '#A8A8FF' }
  ].filter(item => item.value > 0)

  // Get current date range
  const currentDateRange = 'December 2-8'

  return (
    <div className="dashboard-v2">
      {/* Sidebar Navigation */}
      <aside className="sidebar-v2">
        <div className="sidebar-logo">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">School</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <span className="nav-icon">📊</span>
          </Link>
          <Link to="/teachers" className="nav-item">
            <span className="nav-icon">👨‍</span>
          </Link>
          <Link to="/classes" className="nav-item">
            <span className="nav-icon">📚</span>
          </Link>
          <Link to="/students" className="nav-item">
            <span className="nav-icon">👨‍</span>
          </Link>
          <Link to="/timetable" className="nav-item">
            <span className="nav-icon">📅</span>
          </Link>
          <Link to="/payments" className="nav-item">
            <span className="nav-icon">💳</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
          </Link>
          <Link to="/logout" className="nav-item logout">
            <span className="nav-icon">🚪</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content-v2">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <h1 className="welcome-title">Hello, Admin!</h1>
            <p className="welcome-subtitle">Welcome back to School Management</p>
          </div>
          <div className="welcome-actions">
            <button className="icon-btn">
              <span className="icon">⚙️</span>
            </button>
            <button className="icon-btn">
              <span className="icon">🔔</span>
              <span className="badge">3</span>
            </button>
            <div className="profile-pic">
              <img src="https://ui-avatars.com/api/?name=Admin&background=fff&color=FF9F43" alt="Profile" />
            </div>
          </div>
        </div>

        {/* Date Range & Calendar Strip */}
        <div className="calendar-section">
          <div className="date-range">
            <span className="range-text">{currentDateRange}</span>
            <button className="nav-arrow left">‹</button>
            <button className="nav-arrow right">›</button>
          </div>
          <button className="month-btn">
            <span>📅</span> Month
          </button>

          <div className="calendar-strip">
            {weekDays.map((item, index) => (
              <button
                key={index}
                className={`calendar-day ${selectedDate === item.date ? 'selected' : ''}`}
                onClick={() => setSelectedDate(item.date)}
              >
                <span className="day-name">{item.day}</span>
                <span className="day-date">{item.date}</span>
                {selectedDate === item.date && <span className="dot" />}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Reports - Stats Cards */}
        <section className="section">
          <h2 className="section-title">Weekly Reports</h2>
          <div className="time-filter">
            <button className="filter-btn">Today</button>
            <button className="filter-btn active">Week</button>
            <button className="filter-btn">Month</button>
          </div>

          <div className="stats-cards-grid">
            {statsCards.map((card) => (
              <Link to={card.link} key={card.id} className={`stat-card-v2 ${card.color}`}>
                <div className={`stat-icon-box ${card.color}`}>
                  <span className="stat-emoji">{card.icon}</span>
                </div>
                <div className="stat-value-box">
                  <span className="stat-value">{card.value}</span>
                  <span className="stat-unit">{card.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Updating Monitoring - Progress */}
        <section className="section">
          <h2 className="section-title">Performance Monitoring</h2>
          <div className="progress-cards">
            {progressData.map((item, index) => (
              <div 
                key={index} 
                className={`progress-card ${item.dark ? 'dark' : 'light'}`}
              >
                <div className="progress-info">
                  <span className="progress-label">{item.label}</span>
                  <span className="progress-date">{item.date}</span>
                </div>
                <div className="progress-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={item.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                      strokeWidth="3"
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${item.value}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="progress-percentage">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Grid - Left & Right */}
        <div className="main-grid">
          {/* Left Column */}
          <div className="left-column">
            {/* Other Functions */}
            <section className="section">
              <h2 className="section-title">Other Functions</h2>
              <div className="functions-grid">
                {otherFunctions.map((func) => (
                  <div 
                    key={func.id} 
                    className={`function-card ${func.color}`}
                  >
                    <div className="function-header">
                      <span className="function-icon">{func.icon}</span>
                      <button className="menu-dots">⋮</button>
                    </div>
                    <div className="function-content">
                      <span className="function-label">{func.label}</span>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          defaultChecked={func.enabled}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Statistics Chart */}
            <section className="section">
              <h2 className="section-title">Statistics of Activity</h2>
              <div className="chart-card">
                <div className="chart-header">
                  <span className="current-day">CURRENT / FRIDAY</span>
                  <span className="chart-value">58%</span>
                  <span className="chart-icon-small">📊</span>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyChartData}>
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]}
                      >
                        {weeklyChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.day === 'TH' ? '#FF9F43' : '#A8A8FF'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-days">
                  {weeklyChartData.map((item, index) => (
                    <span key={index} className={`chart-day ${item.day === 'TH' ? 'active' : ''}`}>
                      {item.day}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Resource Distribution */}
            <section className="section">
              <h2 className="section-title">Resource Distribution</h2>
              <div className="resource-card">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={resourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {resourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="resource-legend">
                  {resourceData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-dot" style={{ background: item.color }} />
                      <span className="legend-label">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions-list">
                <Link to="/teachers/add" className="quick-action-item orange">
                  <span className="action-icon">👨‍🏫</span>
                  <span className="action-label">Add Teacher</span>
                  <span className="action-arrow">→</span>
                </Link>
                <Link to="/classes/add" className="quick-action-item pink">
                  <span className="action-icon">📚</span>
                  <span className="action-label">Create Class</span>
                  <span className="action-arrow">→</span>
                </Link>
                <Link to="/students/add" className="quick-action-item blue">
                  <span className="action-icon">👨‍</span>
                  <span className="action-label">Add Student</span>
                  <span className="action-arrow">→</span>
                </Link>
                <Link to="/timetable" className="quick-action-item purple">
                  <span className="action-icon">📅</span>
                  <span className="action-label">Generate Timetable</span>
                  <span className="action-arrow">→</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardV2
