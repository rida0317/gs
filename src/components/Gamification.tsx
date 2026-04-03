// src/components/Gamification.tsx - Gamification dashboard (points, badges, leaderboard)

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { 
  useGamificationStore, 
  useLeaderboard, 
  useGamificationStats, 
  useGamificationBadges,
  useStudentBadges,
  awardPoints,
  deductPoints
} from '../store/gamificationStore'
import { useStudents } from '../store/studentsStore'
import { useSchoolStore } from '../store/schoolStore'
import { useAuth } from '../store/AuthContext'
import './Gamification.css'

const Gamification: React.FC = () => {
  const { user } = useAuth()
  const students = useStudents()
  const { schoolName } = useSchoolStore()
  
  const leaderboard = useLeaderboard()
  const stats = useGamificationStats()
  const badges = useGamificationBadges()
  
  const { setEnabled, setPointsConfig, awardPoints: award, deductPoints: deduct } = useGamificationStore()
  const pointsConfig = useGamificationStore((s) => s.pointsConfig)
  const isEnabled = useGamificationStore((s) => s.isEnabled)

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'award' | 'badges' | 'settings'>('leaderboard')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [pointsAmount, setPointsAmount] = useState(10)
  const [pointsReason, setPointsReason] = useState('')
  const [showAwardModal, setShowAwardModal] = useState(false)

  const selectedStudentData = students.find(s => s.id === selectedStudent)
  const studentBadges = useStudentBadges(selectedStudent)
  const studentPoints = useGamificationStore((state) => state.studentPoints.get(selectedStudent))

  const handleAwardPoints = async (isPositive: boolean) => {
    if (!selectedStudent || !pointsReason) {
      alert('⚠️ Veuillez sélectionner un élève et entrer une raison')
      return
    }

    if (!selectedStudentData) return

    try {
      const points = isPositive ? Math.abs(pointsAmount) : -Math.abs(pointsAmount)
      await award(
        selectedStudent,
        selectedStudentData.name,
        selectedStudentData.classId,
        points,
        pointsReason,
        isPositive ? 'reward' : 'penalty',
        user?.uid || '',
        user?.displayName || user?.email || 'Professeur'
      )

      alert(`✅ ${isPositive ? 'Points attribués' : 'Points déduits'} avec succès!`)
      setShowAwardModal(false)
      setPointsAmount(10)
      setPointsReason('')
    } catch (error) {
      alert('❌ Erreur lors de l\'opération')
      console.error(error)
    }
  }

  const quickActions = [
    { label: '📚 Excellente note (≥16)', points: 50, category: 'academic' },
    { label: '📖 Bonne note (≥12)', points: 20, category: 'academic' },
    { label: '✅ Présence parfaite', points: 30, category: 'attendance' },
    { label: '🤝 Comportement exemplaire', points: 25, category: 'behavior' },
    { label: '💯 Note parfaite (20/20)', points: 100, category: 'special' },
    { label: '📈 Progression notable', points: 60, category: 'special' }
  ]

  return (
    <div className="gamification-container">
      <div className="gamification-header">
        <div className="header-content">
          <h1>🏆 Gamification</h1>
          <p>Système de points, badges et classement</p>
        </div>
        <div className="header-actions">
          <span className={`status-badge ${useGamificationStore((s) => s.isEnabled) ? 'enabled' : 'disabled'}`}>
            {useGamificationStore((s) => s.isEnabled) ? '✅ Actif' : '❌ Inactif'}
          </span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="gamification-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalPointsAwarded}</div>
            <div className="stat-label">Points attribués</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalBadgesEarned}</div>
            <div className="stat-label">Badges débloqués</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeStudents}</div>
            <div className="stat-label">Élèves actifs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.averagePoints.toFixed(0)}</div>
            <div className="stat-label">Points moyens</div>
          </div>
          {stats.topStudent && (
            <div className="stat-card highlight">
              <div className="stat-value">🥇</div>
              <div className="stat-label">{stats.topStudent.studentName}</div>
              <div className="stat-sub">{stats.topStudent.totalPoints} pts</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="gamification-tabs">
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Classement
        </button>
        <button
          className={`tab ${activeTab === 'award' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('award')
            setShowAwardModal(true)
          }}
        >
          ⭐ Attribuer des points
        </button>
        <button
          className={`tab ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          🎖️ Badges
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Paramètres
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="leaderboard-section">
          <h2>🏆 Classement des Élèves</h2>
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Aucun point attribué pour le moment</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.studentId}
                  className={`leaderboard-item rank-${index + 1}`}
                >
                  <div className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="student-info">
                    <div className="student-name">{entry.studentName}</div>
                    <div className="student-class">{entry.classId}</div>
                  </div>
                  <div className="student-stats">
                    <div className="points">{entry.totalPoints} pts</div>
                    <div className="level">Niveau {entry.level}</div>
                    <div className="badges">🎖️ {entry.badgesCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Award Points Modal */}
      {showAwardModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowAwardModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            zIndex: 100000
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-color)' }}>⭐ Attribuer des points</h2>
              <button className="close-btn" onClick={() => setShowAwardModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              <div className="form-group">
                <label>Élève:</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">-- Sélectionner un élève --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.classId})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && studentPoints && (
                <div className="student-current-points">
                  <div className="points-display">
                    <span className="points-label">Points actuels:</span>
                    <span className="points-value">{studentPoints.totalPoints}</span>
                  </div>
                  <div className="level-display">
                    <span className="level-label">Niveau:</span>
                    <span className="level-value">{studentPoints.level}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Points:</label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000"
                />
              </div>

              <div className="form-group">
                <label>Raison:</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="Ex: Excellente participation en classe"
                />
              </div>

              <div className="quick-actions">
                <label>Actions rapides:</label>
                <div className="quick-actions-grid">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="quick-action-btn"
                      onClick={() => {
                        setPointsAmount(action.points)
                        setPointsReason(action.label)
                      }}
                    >
                      {action.label} (+{action.points})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-deduct"
                onClick={() => handleAwardPoints(false)}
                disabled={!selectedStudent || !pointsReason}
              >
                ➖ Déduire des points
              </button>
              <button
                className="btn-award"
                onClick={() => handleAwardPoints(true)}
                disabled={!selectedStudent || !pointsReason}
              >
                ✅ Attribuer des points
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="badges-section">
          <h2>🎖️ Badges Disponibles</h2>
          <div className="badges-grid">
            {badges.map((badge) => (
              <div key={badge.id} className={`badge-card rarity-${badge.rarity}`}>
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
                <div className="badge-requirement">
                  <span className="points-required">{badge.pointsRequired} points</span>
                  <span className={`rarity-badge rarity-${badge.rarity}`}>
                    {badge.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="settings-section">
          <h2>⚙️ Paramètres de Gamification</h2>

          <div className="settings-group">
            <h3>Points par action</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>📚 Excellente note (≥16):</label>
                <input
                  type="number"
                  value={pointsConfig?.excellentGrade || 50}
                  onChange={(e) => setPointsConfig({ excellentGrade: parseInt(e.target.value) || 50 })}
                />
              </div>
              <div className="setting-item">
                <label>📖 Bonne note (≥12):</label>
                <input
                  type="number"
                  value={pointsConfig?.goodGrade || 20}
                  onChange={(e) => setPointsConfig({ goodGrade: parseInt(e.target.value) || 20 })}
                />
              </div>
              <div className="setting-item">
                <label>✅ Présence parfaite:</label>
                <input
                  type="number"
                  value={pointsConfig?.perfectAttendance || 30}
                  onChange={(e) => setPointsConfig({ perfectAttendance: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="setting-item">
                <label>🤝 Bon comportement:</label>
                <input
                  type="number"
                  value={pointsConfig?.goodBehavior || 25}
                  onChange={(e) => setPointsConfig({ goodBehavior: parseInt(e.target.value) || 25 })}
                />
              </div>
            </div>
          </div>

          <div className="settings-group">
            <h3>Activer/Désactiver</h3>
            <div className="toggle-setting">
              <label>Système de gamification:</label>
              <select
                value={isEnabled ? 'true' : 'false'}
                onChange={(e) => setEnabled(e.target.value === 'true')}
              >
                <option value="true">✅ Activé</option>
                <option value="false">❌ Désactivé</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gamification
