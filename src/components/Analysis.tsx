// src/components/Analysis.tsx - AI Analysis and Statistics

import React, { useState, useRef, useEffect } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useGradesStore } from '../store/gradesStore'
import { t } from '../utils/translations'
import { AIService, AIResponse } from '../services/aiService'
import './Analysis.css'

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  responseType?: 'text' | 'list' | 'table' | 'metric' | 'report' | 'summary';
  data?: any;
  title?: string;
  recommendation?: string;
  timestamp: Date;
}

const Analysis: React.FC = () => {
  const store = useSchoolStore()
  const { grades = [] } = useGradesStore()
  const { 
    teachers = [], 
    classes = [], 
    timetables = {}, 
    language = 'en' 
  } = store
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assistant'>('dashboard')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const aiService = new AIService(store, grades)

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        content: t('analysis.welcome', language),
        timestamp: new Date()
      }
    ])
  }, [language])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setQuery('')

    setTimeout(() => {
      try {
        const response = aiService.processQuery(userMsg.content)
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: response.content || '...',
          responseType: response.type,
          data: response.data,
          title: response.title,
          recommendation: response.recommendation,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMsg])
      } catch (err) {
        console.error('AI Error:', err)
        setMessages(prev => [...prev, {
          id: 'error',
          sender: 'ai',
          content: t('analysis.error', language),
          timestamp: new Date()
        }])
      }
    }, 600)
  }

  const handleQuickAction = (actionQuery: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: actionQuery,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    
    setTimeout(() => {
      try {
        const response = aiService.processQuery(actionQuery)
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: response.content || '...',
          responseType: response.type,
          data: response.data,
          title: response.title,
          recommendation: response.recommendation,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMsg])
      } catch (err) {
        console.error('AI Error:', err)
      }
    }, 600)
  }

  const renderMessage = (msg: ChatMessage) => {
    const isRtl = /[\u0600-\u06FF]/.test(msg.content) || /[\u0600-\u06FF]/.test(msg.title || '')
    
    return (
      <div key={msg.id} className={`message ${msg.sender} ${isRtl ? 'rtl' : ''} type-${msg.responseType || 'text'}`}>
        <div className="message-bubble">
          {msg.title && <div className="message-title">🤖 {msg.title}</div>}
          <div className="message-content">{msg.content}</div>
          
          {msg.responseType === 'list' && Array.isArray(msg.data) && (
            <ul className="message-data-list">
              {msg.data.map((item: any, idx: number) => (
                <li key={idx}>{String(item)}</li>
              ))}
            </ul>
          )}

          {msg.responseType === 'table' && Array.isArray(msg.data) && (
            <div className="message-data-table-container">
              <table className="message-data-table">
                <thead>
                  <tr>
                    <th>{isRtl ? 'الاسم' : 'Name'}</th>
                    <th>{isRtl ? 'القيمة / النتيجة' : 'Value / Result'}</th>
                  </tr>
                </thead>
                <tbody>
                  {msg.data.map((row: any, idx: number) => (
                    <tr key={idx}>
                      <td>{row?.name || 'N/A'}</td>
                      <td>{row?.value || row?.average || row?.hours || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(msg.responseType === 'report' || msg.responseType === 'summary') && (
            <div className="rich-report-view">
              <div className="report-badge">{msg.responseType.toUpperCase()}</div>
              {msg.recommendation && (
                <div className="report-recommendation">
                  <strong>💡 {isRtl ? 'توصية الخبير:' : 'Expert Recommendation:'}</strong>
                  <p>{msg.recommendation}</p>
                </div>
              )}
            </div>
          )}

          {msg.responseType !== 'report' && msg.responseType !== 'summary' && msg.recommendation && (
            <div className="message-recommendation">
              <strong>💡 {isRtl ? 'توصية:' : 'Recommendation:'}</strong>
              <p>{msg.recommendation}</p>
            </div>
          )}

          <div className="message-time">
            {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>
      </div>
    )
  }

  // --- Dashboard Logic (Existing) ---
  const totalTeachers = teachers?.length || 0
  const totalClasses = classes?.length || 0
  const avgHoursPerTeacher = totalTeachers > 0
    ? teachers.reduce((sum, t) => sum + (t.maxHoursPerWeek || 0), 0) / totalTeachers
    : 0
  const classesWithTimetables = Object.keys(timetables || {}).length

  const getTeacherLoad = (teacherId: string) => {
    let hours = 0
    if (!timetables) return 0
    Object.values(timetables).forEach((classTimetable: any) => {
      if (!classTimetable) return
      Object.values(classTimetable).forEach((daySlots: any) => {
        if (Array.isArray(daySlots)) {
          daySlots.forEach(slot => {
            if (slot && slot.teacherId === teacherId) hours++
          })
        }
      })
    })
    return hours
  }

  const overloadedTeachers = teachers.filter(t => getTeacherLoad(t.id) > (t.maxHoursPerWeek || 40))
  const underloadedTeachers = teachers.filter(t => getTeacherLoad(t.id) < (t.maxHoursPerWeek || 20) * 0.5)


  return (
    <div className="analysis-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav.analysis', language)}</h1>
          <p className="page-subtitle">{t('analysis.aiAnalysis', language)}</p>
        </div>
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {t('analysis.dashboard', language)}
          </button>
          <button
            className={`tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveTab('assistant')}
          >
            {t('analysis.assistant', language)}
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Statistics Overview */}
          <div className="stats-overview">
            <div className="stat-box">
              <div className="stat-value">{totalTeachers}</div>
              <div className="stat-label">{t('analysis.totalTeachers', language)}</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{totalClasses}</div>
              <div className="stat-label">{t('analysis.totalClasses', language)}</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{classesWithTimetables}</div>
              <div className="stat-label">{t('analysis.classesWithTimetable', language)}</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{avgHoursPerTeacher.toFixed(1)}</div>
              <div className="stat-label">{t('analysis.avgHours', language)}</div>
            </div>
          </div>

          {/* Issues */}
          <div className="analysis-section">
            <h2 className="section-title">⚠️ {t('analysis.detectedIssues', language) || 'Detected Issues'}</h2>
            
            {overloadedTeachers.length > 0 && (
              <div className="issue-card issue-danger">
                <h3>{t('analysis.overloadedTeachers', language)}</h3>
                <p>{t('analysis.teacherExceededHours', language).replace('{count}', overloadedTeachers.length.toString())}</p>
                <ul>
                  {overloadedTeachers.map(t => (
                    <li key={t.id}>{t.name} ({getTeacherLoad(t.id)}h / {t.maxHoursPerWeek}h)</li>
                  ))}
                </ul>
              </div>
            )}

            {underloadedTeachers.length > 0 && (
              <div className="issue-card issue-warning">
                <h3>{t('analysis.underloadedTeachers', language)}</h3>
                <p>{t('analysis.teacherHasNoClass', language).replace('{count}', underloadedTeachers.length.toString())}</p>
                <ul>
                  {underloadedTeachers.map(t => (
                    <li key={t.id}>{t.name} ({getTeacherLoad(t.id)}h / {t.maxHoursPerWeek}h)</li>
                  ))}
                </ul>
              </div>
            )}

            {overloadedTeachers.length === 0 && underloadedTeachers.length === 0 && (
              <div className="issue-card issue-success">
                <h3>✅ {t('analysis.allGood', language) || 'All Good!'}</h3>
                <p>{t('analysis.noMajorIssues', language) || 'No major workload issues detected.'}</p>
              </div>
            )}
          </div>

          {/* Workload Analysis */}
          <div className="analysis-section">
            <h2 className="section-title">📊 {t('analysis.workloadDistribution', language) || 'Workload Distribution'}</h2>
            <div className="workload-list">
              {teachers.map((teacher) => {
                const load = getTeacherLoad(teacher.id)
                const percentage = (load / teacher.maxHoursPerWeek) * 100
                const isOverloaded = percentage > 100
                const isUnderloaded = percentage < 50

                return (
                  <div key={teacher.id} className="workload-item">
                    <div className="workload-header">
                      <span className="teacher-name">{teacher.name}</span>
                      <span className={`workload-status ${isOverloaded ? 'over' : isUnderloaded ? 'under' : 'normal'}`}>
                        {load} / {teacher.maxHoursPerWeek}h
                      </span>
                    </div>
                    <div className="workload-bar">
                      <div
                        className={`workload-fill ${isOverloaded ? 'over' : isUnderloaded ? 'under' : 'normal'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        /* AI Assistant Tab */
        <div className="ai-assistant-container">
          <div className="chat-window">
            <div className="chat-header-actions">
              <button 
                className="btn-text btn-sm" 
                onClick={() => setMessages([messages[0]])}
              >
                🗑️ {store.language === 'ar' ? 'مسح المحادثة' : 'Clear Chat'}
              </button>
            </div>
            <div className="messages-list">
              {messages.map((msg) => renderMessage(msg))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <button onClick={() => handleQuickAction(language === 'ar' ? t('analysis.qStudentRanking', language) : t('analysis.qStudentRanking', language))}>🏆 {t('analysis.studentRankings', language)}</button>
              <button onClick={() => handleQuickAction(language === 'ar' ? t('analysis.qRiskAnalysis', language) : t('analysis.qRiskAnalysis', language))}>🚨 {t('analysis.riskAnalysis', language)}</button>
              <button onClick={() => handleQuickAction(language === 'ar' ? t('analysis.qParentSummary', language) : t('analysis.qParentSummary', language))}>👨‍👩‍👧 {t('analysis.parentSummary', language)}</button>
              <button onClick={() => handleQuickAction(language === 'ar' ? t('analysis.qAcademicPredictions', language) : t('analysis.qAcademicPredictions', language))}>🔮 {t('analysis.academicPredictions', language)}</button>
              <button onClick={() => handleQuickAction(language === 'ar' ? t('analysis.qScheduleConflicts', language) : t('analysis.qScheduleConflicts', language))}>📅 {t('analysis.scheduleConflicts', language)}</button>
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                placeholder={t('analysis.askAnything', language)}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!query.trim()}>
                🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analysis
