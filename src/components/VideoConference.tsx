// src/components/VideoConference.tsx - Video conferencing with Jitsi Meet integration

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { useSchoolStore } from '../store/schoolStore'
import './VideoConference.css'

interface Meeting {
  id: string
  name: string
  roomName: string
  scheduledBy: string
  scheduledByName: string
  scheduledAt: string
  startTime: string
  endTime: string
  participants: string[]
  status: 'scheduled' | 'active' | 'ended'
}

const VideoConference: React.FC = () => {
  const { user } = useAuth()
  const { schoolName } = useSchoolStore()
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<any>(null)

  const [activeTab, setActiveTab] = useState<'meet' | 'schedule'>('meet')
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [meetingName, setMeetingName] = useState('')
  const [scheduledMeetings, setScheduledMeetings] = useState<Meeting[]>([])
  const [scheduleData, setScheduleData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '60'
  })

  // Load Jitsi Meet script
  useEffect(() => {
    if (!(window as any).JitsiMeetExternalAPI) {
      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
      }
    }
  }, [])

  const startMeeting = () => {
    if (!meetingName.trim()) {
      alert('⚠️ Veuillez entrer un nom pour la réunion')
      return
    }

    const roomName = `${schoolName?.replace(/\s+/g, '') || 'school'}-${meetingName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`
    
    startJitsiMeeting(roomName)
    setIsInMeeting(true)
  }

  const startJitsiMeeting = (roomName: string) => {
    if (!jitsiContainerRef.current || !(window as any).JitsiMeetExternalAPI) {
      alert('❌ Impossible de démarrer la réunion. Veuillez rafraîchir la page.')
      return
    }

    const domain = 'meet.jit.si'
    const options = {
      roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableModeratorIndicator: true,
        enableEmailInStats: false,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'download',
          'help',
          'mute-everyone',
        ],
      },
      userInfo: {
        displayName: user?.displayName || user?.email || 'Utilisateur',
        email: user?.email
      }
    }

    jitsiApiRef.current = new (window as any).JitsiMeetExternalAPI(domain, options)

    jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
      handleMeetingEnd()
    })

    jitsiApiRef.current.addEventListener('participantJoined', (participant: any) => {
      console.log('Participant joined:', participant)
    })

    jitsiApiRef.current.addEventListener('participantLeft', (participant: any) => {
      console.log('Participant left:', participant)
    })
  }

  const handleMeetingEnd = () => {
    setIsInMeeting(false)
    setMeetingName('')
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose()
      jitsiApiRef.current = null
    }
  }

  const scheduleMeeting = () => {
    if (!scheduleData.name || !scheduleData.date || !scheduleData.time) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires')
      return
    }

    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      name: scheduleData.name,
      roomName: `${schoolName?.replace(/\s+/g, '') || 'school'}-${scheduleData.name.replace(/\s+/g, '-').toLowerCase()}`,
      scheduledBy: user?.uid || '',
      scheduledByName: user?.displayName || user?.email || 'Utilisateur',
      scheduledAt: new Date().toISOString(),
      startTime: `${scheduleData.date}T${scheduleData.time}`,
      endTime: new Date(new Date(`${scheduleData.date}T${scheduleData.time}`).getTime() + parseInt(scheduleData.duration) * 60000).toISOString(),
      participants: [],
      status: 'scheduled'
    }

    setScheduledMeetings(prev => [newMeeting, ...prev])
    alert('✅ Réunion planifiée avec succès!')
    setScheduleData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '60'
    })
  }

  const joinScheduledMeeting = (meeting: Meeting) => {
    setMeetingName(meeting.name)
    startJitsiMeeting(meeting.roomName)
    setIsInMeeting(true)
  }

  const copyMeetingLink = (roomName: string) => {
    const link = `https://meet.jit.si/${roomName}`
    navigator.clipboard.writeText(link)
    alert('✅ Lien de la réunion copié!')
  }

  const deleteScheduledMeeting = (meetingId: string) => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cette réunion?')) {
      setScheduledMeetings(prev => prev.filter(m => m.id !== meetingId))
      alert('✅ Réunion supprimée')
    }
  }

  return (
    <div className="video-conference-container">
      <div className="vc-header">
        <div className="header-content">
          <h1>📹 Visioconférence</h1>
          <p>Réunions et cours en ligne avec Jitsi Meet</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="vc-tabs">
        <button
          className={`tab ${activeTab === 'meet' ? 'active' : ''}`}
          onClick={() => setActiveTab('meet')}
        >
          🎥 Réunion Instantanée
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Planifier une réunion
        </button>
      </div>

      {/* Instant Meeting Tab */}
      {activeTab === 'meet' && (
        <div className="meet-section">
          {!isInMeeting ? (
            <div className="start-meeting-card">
              <div className="meeting-icon">🎥</div>
              <h2>Démarrer une réunion instantanée</h2>
              <p>Créez une réunion vidéo et invitez des participants</p>

              <div className="form-group">
                <label>Nom de la réunion:</label>
                <input
                  type="text"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  placeholder="Ex: Cours Mathématiques 2BAC"
                  onKeyPress={(e) => e.key === 'Enter' && startMeeting()}
                />
              </div>

              <button className="btn-start" onClick={startMeeting}>
                🎬 Démarrer la réunion
              </button>

              <div className="meeting-tips">
                <h4>💡 Conseils:</h4>
                <ul>
                  <li>Partagez le lien de la réunion avec les participants</li>
                  <li>Utilisez un casque pour une meilleure qualité audio</li>
                  <li>Assurez-vous d'avoir une bonne connexion internet</li>
                  <li>Testez votre caméra et microphone avant de commencer</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="meeting-active">
              <div className="meeting-header">
                <h3>🔴 {meetingName || 'Réunion en cours'}</h3>
                <button className="btn-end" onClick={handleMeetingEnd}>
                  ❌ Terminer
                </button>
              </div>
              <div ref={jitsiContainerRef} className="jitsi-container"></div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Meeting Tab */}
      {activeTab === 'schedule' && (
        <div className="schedule-section">
          <div className="schedule-form-card">
            <h2>📅 Planifier une réunion</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Nom de la réunion *</label>
                <input
                  type="text"
                  value={scheduleData.name}
                  onChange={(e) => setScheduleData({ ...scheduleData, name: e.target.value })}
                  placeholder="Ex: Réunion Parents-Professeurs"
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heure *</label>
                <input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Durée (minutes)</label>
                <select
                  value={scheduleData.duration}
                  onChange={(e) => setScheduleData({ ...scheduleData, duration: e.target.value })}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="90">1h30</option>
                  <option value="120">2 heures</option>
                </select>
              </div>
            </div>

            <button className="btn-schedule" onClick={scheduleMeeting}>
              📅 Planifier la réunion
            </button>
          </div>

          {/* Scheduled Meetings List */}
          <div className="scheduled-meetings-list">
            <h3>📋 Réunions planifiées ({scheduledMeetings.length})</h3>
            
            {scheduledMeetings.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>Aucune réunion planifiée</p>
              </div>
            ) : (
              <div className="meetings-grid">
                {scheduledMeetings.map((meeting) => {
                  const startTime = new Date(meeting.startTime)
                  const isNow = new Date() >= startTime && new Date() <= new Date(meeting.endTime)
                  const isFuture = new Date() < startTime

                  return (
                    <div key={meeting.id} className={`meeting-card ${isNow ? 'active' : ''}`}>
                      <div className="meeting-card-header">
                        <h4>{meeting.name}</h4>
                        {isNow && <span className="live-badge">🔴 EN DIRECT</span>}
                        {isFuture && <span className="scheduled-badge">📅 À venir</span>}
                      </div>
                      
                      <div className="meeting-card-body">
                        <p className="meeting-date">
                          📅 {startTime.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="meeting-time">
                          ⏰ {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(meeting.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="meeting-organizer">
                          👤 {meeting.scheduledByName}
                        </p>
                      </div>

                      <div className="meeting-card-actions">
                        {isNow && (
                          <button
                            className="btn-join"
                            onClick={() => joinScheduledMeeting(meeting)}
                          >
                            🎥 Rejoindre
                          </button>
                        )}
                        <button
                          className="btn-copy"
                          onClick={() => copyMeetingLink(meeting.roomName)}
                        >
                          🔗 Copier le lien
                        </button>
                        <button
                          className="btn-delete-meeting"
                          onClick={() => deleteScheduledMeeting(meeting.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoConference
