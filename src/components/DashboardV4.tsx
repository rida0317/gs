// src/components/DashboardV4.tsx - Modern Colorful Dashboard with Gradient Cards

import React, { useMemo } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useStudents } from '../store/studentsStore'
import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './DashboardV4.css'

const DashboardV4: React.FC = () => {
  const { teachers, classes, salles, students, timetables } = useSchoolStore()
  const currentStudents = useStudents()
  const { t } = useTranslation()

  // Calculate statistics
  const stats = useMemo(() => ({
    teachers: teachers.length,
    classes: classes.length,
    salles: salles.length,
    students: currentStudents.length,
    academicYear: '2025-2026'
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
        max: teacher.maxHoursPerWeek || 24
      }
    })
  }, [teachers, timetables])

  return (
    <div className="dashboard-v4">
      {/* Main Header Banner */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <div className="banner-icon">📊</div>
          <div className="banner-text">
            <h1 className="banner-title">{t('dashboard.title')}</h1>
            <p className="banner-subtitle">{t('dashboard.overview')}</p>
          </div>
        </div>
        <div className="banner-year">
          <div className="year-icon">📅</div>
          <span className="year-text">{stats.academicYear}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-cards-grid">
        <Link to="/teachers" className="stat-card teachers-card">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <span className="stat-emoji">👨‍🏫</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.teachers}</span>
              <span className="stat-label">{t('nav.teachers').toUpperCase()}</span>
            </div>
            <div className="stat-arrow">→</div>
          </div>
        </Link>

        <Link to="/classes" className="stat-card classes-card">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <span className="stat-emoji">📚</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.classes}</span>
              <span className="stat-label">{t('nav.classes').toUpperCase()}</span>
            </div>
            <div className="stat-arrow">→</div>
          </div>
        </Link>

        <Link to="/salles" className="stat-card salles-card">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <span className="stat-emoji">🏫</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.salles}</span>
              <span className="stat-label">{t('nav.salles').toUpperCase()}</span>
            </div>
            <div className="stat-arrow">→</div>
          </div>
        </Link>

        <Link to="/students" className="stat-card students-card">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <span className="stat-emoji">👨‍🎓</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.students}</span>
              <span className="stat-label">{t('nav.students').toUpperCase()}</span>
            </div>
            <div className="stat-arrow">→</div>
          </div>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card-wide">
          <div className="chart-card-header">
            <h3 className="chart-card-title">
              <span className="chart-emoji">📊</span>
              {t('dashboard.teacherWorkload')}
            </h3>
          </div>
          <div className="chart-card-body">
            {teacherWorkloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teacherWorkloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#999" fontSize={12} />
                  <YAxis stroke="#999" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="max" name="Max" fill="#e0e7ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">
                <span className="empty-emoji">📊</span>
                <p>{t('dashboard.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-heading">
          <span className="heading-emoji">⚡</span>
          {t('dashboard.quickActions')}
        </h2>
        <div className="quick-actions-grid">
          <Link to="/teachers/add" className="quick-action-item">
            <span className="quick-action-icon">👨‍🏫</span>
            <span className="quick-action-label">{t('dashboard.addTeacher')}</span>
          </Link>
          <Link to="/classes/add" className="quick-action-item">
            <span className="quick-action-icon">📚</span>
            <span className="quick-action-label">{t('dashboard.createClass')}</span>
          </Link>
          <Link to="/students/add" className="quick-action-item">
            <span className="quick-action-icon">👨‍🎓</span>
            <span className="quick-action-label">{t('dashboard.addStudent')}</span>
          </Link>
          <Link to="/timetable" className="quick-action-item">
            <span className="quick-action-icon">📅</span>
            <span className="quick-action-label">{t('dashboard.generateTimetable')}</span>
          </Link>
          <Link to="/payments" className="quick-action-item">
            <span className="quick-action-icon">💳</span>
            <span className="quick-action-label">{t('dashboard.recordPayment')}</span>
          </Link>
          <Link to="/analytics" className="quick-action-item">
            <span className="quick-action-icon">📈</span>
            <span className="quick-action-label">{t('dashboard.viewAnalytics')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardV4
