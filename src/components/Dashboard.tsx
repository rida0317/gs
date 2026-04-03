// src/components/Dashboard.tsx - Modern Dashboard with Charts & Analytics

import React, { useMemo } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useStudents } from '../store/studentsStore'
import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import './DashboardModern.css'

const Dashboard: React.FC = () => {
  const { teachers, classes, salles, students, timetables } = useSchoolStore()
  const currentStudents = useStudents()
  const { t } = useTranslation()

  // Calculate statistics
  const stats = useMemo(() => ({
    teachers: teachers.length,
    classes: classes.length,
    salles: salles.length,
    students: currentStudents.length,
    timetables: Object.keys(timetables).length
  }), [teachers, classes, salles, currentStudents, timetables])

  // Calculate teacher workload
  const teacherWorkloadData = useMemo(() => {
    return teachers.slice(0, 8).map(teacher => {
      let scheduledHours = 0
      Object.values(timetables).forEach((classTimetable: any) => {
        Object.values(classTimetable || {}).forEach((daySlots: any) => {
          if (Array.isArray(daySlots)) {
            daySlots.forEach((slot: any) => {
              if (slot && slot.teacherId === teacher.id) {
                scheduledHours++
              }
            })
          }
        })
      })
      return {
        name: teacher.name.split(' ').pop() || teacher.name,
        hours: scheduledHours,
        max: teacher.maxHoursPerWeek
      }
    })
  }, [teachers, timetables])

  // Student distribution by class
  const studentByClassData = useMemo(() => {
    return classes.map(cls => ({
      name: cls.name,
      students: currentStudents.filter(s => s.classId === cls.id).length
    })).filter(item => item.students > 0)
  }, [classes, currentStudents])

  // Weekly schedule distribution
  const weeklyData = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayNames = {
      Monday: t('days.monday'),
      Tuesday: t('days.tuesday'),
      Wednesday: t('days.wednesday'),
      Thursday: t('days.thursday'),
      Friday: t('days.friday'),
      Saturday: t('days.saturday'),
      Sunday: t('days.sunday')
    }
    
    return days.map(day => {
      let count = 0
      Object.values(timetables).forEach((classTimetable: any) => {
        const slots = classTimetable?.[day]
        if (Array.isArray(slots)) {
          count += slots.filter((s: any) => s && s.subject).length
        }
      })
      return { name: dayNames[day as keyof typeof dayNames] || day, sessions: count }
    })
  }, [timetables, t])

  // Resource distribution (Pie Chart)
  const resourceData = useMemo(() => {
    return [
      { name: t('nav.teachers'), value: stats.teachers, color: '#4F46E5' },
      { name: t('nav.classes'), value: stats.classes, color: '#10B981' },
      { name: t('nav.salles'), value: stats.salles, color: '#F59E0B' },
      { name: t('nav.students'), value: stats.students, color: '#EF4444' }
    ].filter(item => item.value > 0)
  }, [stats, t])

  // Attendance simulation (last 7 days)
  const attendanceData = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        present: Math.floor(Math.random() * 50) + stats.students * 0.7,
        absent: Math.floor(Math.random() * 20) + stats.students * 0.1
      })
    }
    return days
  }, [stats.students])

  // Subject distribution
  const subjectData = useMemo(() => {
    const subjectCount: { [key: string]: number } = {}
    Object.values(timetables).forEach((classTimetable: any) => {
      Object.values(classTimetable || {}).forEach((daySlots: any) => {
        if (Array.isArray(daySlots)) {
          daySlots.forEach((slot: any) => {
            if (slot && slot.subject) {
              subjectCount[slot.subject] = (subjectCount[slot.subject] || 0) + 1
            }
          })
        }
      })
    })
    return Object.entries(subjectCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [timetables])

  // Quick actions
  const quickActions = [
    { icon: '👨‍🏫', label: t('dashboard.addTeacher'), link: '/teachers/add', color: '#4F46E5' },
    { icon: '📚', label: t('dashboard.createClass'), link: '/classes/add', color: '#10B981' },
    { icon: '📅', label: t('dashboard.generateTimetable'), link: '/timetable', color: '#F59E0B' },
    { icon: '👨‍🎓', label: t('dashboard.addStudent'), link: '/students/add', color: '#EF4444' },
    { icon: '📊', label: t('dashboard.viewAnalytics'), link: '/analytics', color: '#8B5CF6' },
    { icon: '💳', label: t('dashboard.recordPayment'), link: '/payments', color: '#06B6D4' }
  ]

  // Recent activity (mock)
  const recentActivities = [
    { icon: '👨‍🏫', text: t('dashboard.newTeacherAdded'), time: '2h ago', type: 'success' },
    { icon: '📚', text: t('dashboard.classScheduleUpdated'), time: '5h ago', type: 'info' },
    { icon: '👨‍🎓', text: t('dashboard.newStudentEnrolled'), time: '1d ago', type: 'success' },
    { icon: '🔄', text: t('dashboard.substitutionCreated'), time: '1d ago', type: 'warning' },
    { icon: '📝', text: t('dashboard.examScheduled'), time: '2d ago', type: 'info' }
  ]

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="dashboard-modern">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            {t('dashboard.title')}
          </h1>
          <p className="dashboard-subtitle">{t('dashboard.overview')}</p>
        </div>
        <div className="header-actions">
          <div className="academic-year-badge">
            <span className="badge-icon">📅</span>
            {stats.academicYear || '2025-2026'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-modern">
        <Link to="/teachers" className="stat-card-modern teachers">
          <div className="stat-card-background" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }} />
          <div className="stat-card-content">
            <div className="stat-card-icon">👨‍🏫</div>
            <div className="stat-card-info">
              <div className="stat-card-value">{stats.teachers}</div>
              <div className="stat-card-label">{t('nav.teachers')}</div>
            </div>
            <div className="stat-card-arrow">→</div>
          </div>
        </Link>

        <Link to="/classes" className="stat-card-modern classes">
          <div className="stat-card-background" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} />
          <div className="stat-card-content">
            <div className="stat-card-icon">📚</div>
            <div className="stat-card-info">
              <div className="stat-card-value">{stats.classes}</div>
              <div className="stat-card-label">{t('nav.classes')}</div>
            </div>
            <div className="stat-card-arrow">→</div>
          </div>
        </Link>

        <Link to="/salles" className="stat-card-modern salles">
          <div className="stat-card-background" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }} />
          <div className="stat-card-content">
            <div className="stat-card-icon">🏫</div>
            <div className="stat-card-info">
              <div className="stat-card-value">{stats.salles}</div>
              <div className="stat-card-label">{t('nav.salles')}</div>
            </div>
            <div className="stat-card-arrow">→</div>
          </div>
        </Link>

        <Link to="/students" className="stat-card-modern students">
          <div className="stat-card-background" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }} />
          <div className="stat-card-content">
            <div className="stat-card-icon">👨‍🎓</div>
            <div className="stat-card-info">
              <div className="stat-card-value">{stats.students}</div>
              <div className="stat-card-label">{t('nav.students')}</div>
            </div>
            <div className="stat-card-arrow">→</div>
          </div>
        </Link>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        {/* Teacher Workload - Bar Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3 className="chart-title">
              <span className="chart-icon">📊</span>
              {t('dashboard.teacherWorkload')}
            </h3>
          </div>
          <div className="chart-container">
            {teacherWorkloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={teacherWorkloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="hours" name="Scheduled Hours" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="max" name="Max Hours" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <span className="empty-icon">📊</span>
                <p>{t('dashboard.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resource Distribution - Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span className="chart-icon">🥧</span>
              {t('dashboard.resourceDistribution')}
            </h3>
          </div>
          <div className="chart-container">
            {resourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={resourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <span className="empty-icon">🥧</span>
                <p>{t('dashboard.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        {/* Weekly Schedule - Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span className="chart-icon">📈</span>
              {t('dashboard.weeklySchedule')}
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  name="Sessions"
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorSessions)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Distribution - Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span className="chart-icon">📉</span>
              {t('dashboard.studentDistribution')}
            </h3>
          </div>
          <div className="chart-container">
            {studentByClassData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={studentByClassData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    name="Students"
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <span className="empty-icon">📉</span>
                <p>{t('dashboard.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Subjects - Horizontal Bar */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span className="chart-icon">📚</span>
              {t('dashboard.topSubjects')}
            </h3>
          </div>
          <div className="chart-container">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Sessions" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <span className="empty-icon">📚</span>
                <p>{t('dashboard.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3 - Attendance */}
      <div className="charts-grid full">
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3 className="chart-title">
              <span className="chart-icon">✅</span>
              {t('dashboard.attendanceTrend')}
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  name="Present"
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="absent" 
                  name="Absent"
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#colorAbsent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity */}
      <div className="dashboard-grid-split">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="section-title-modern">
            <span className="section-icon">⚡</span>
            {t('dashboard.quickActions')}
          </h2>
          <div className="quick-actions-bento">
            {quickActions.map((action, index) => (
              <Link 
                to={action.link} 
                key={index} 
                className="quick-action-bento"
                style={{ '--action-color': action.color } as React.CSSProperties}
              >
                <span className="quick-action-bento-icon">{action.icon}</span>
                <span className="quick-action-bento-label">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2 className="section-title-modern">
            <span className="section-icon">🔔</span>
            {t('dashboard.recentActivity')}
          </h2>
          <div className="activity-timeline">
            {recentActivities.map((activity, index) => (
              <div key={index} className={`activity-item-modern ${activity.type}`}>
                <div className="activity-dot" />
                <div className="activity-content">
                  <span className="activity-icon-modern">{activity.icon}</span>
                  <div className="activity-info">
                    <span className="activity-text-modern">{activity.text}</span>
                    <span className="activity-time-modern">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips Card */}
      <div className="tips-section">
        <div className="tips-card-modern">
          <div className="tips-header">
            <h2 className="tips-title">
              <span className="tips-icon">💡</span>
              {t('dashboard.quickTips')}
            </h2>
          </div>
          <ul className="tips-list-modern">
            <li>
              <span className="tip-bullet">✨</span>
              {t('dashboard.tips.useShortcuts')}
            </li>
            <li>
              <span className="tip-bullet">🤖</span>
              {t('dashboard.tips.autoTimetable')}
            </li>
            <li>
              <span className="tip-bullet">📅</span>
              {t('dashboard.tips.teacherAvailability')}
            </li>
            <li>
              <span className="tip-bullet">📄</span>
              {t('dashboard.tips.pdfReports')}
            </li>
            <li>
              <span className="tip-bullet">💾</span>
              {t('dashboard.tips.backups')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
