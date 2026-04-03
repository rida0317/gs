import React, { useState, useRef, useEffect } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useStudentsStore } from '../store/studentsStore'
import { useGradesStore } from '../store/gradesStore'
import { useNotificationsStore } from '../store/notificationsStore'
import { useMonthlyPaymentsStore } from '../store/monthlyPaymentsStore'
import { usePaymentsStore } from '../store/paymentsStore'
import { useBackupStore, useBackups } from '../store/backupStore'
import { twoFAService } from '../services/2fa.service'
import { useAuth } from '../store/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import './SettingsExtended.css'

const SettingsExtended: React.FC = () => {
  const { user } = useAuth()
  const {
    schoolName, logo, academicYear, language, setSchoolInfo, setLanguage,
    exportBackup, importBackup, syncAllToSupabase, teachers,
    replacements, clearAllReplacements,
    customSubjects, addCustomSubject, deleteCustomSubject
  } = useSchoolStore()
  const { students, clearAllStudents } = useStudentsStore()
  const { clearGrades } = useGradesStore()
  const { clearAllNotifications } = useNotificationsStore()
  const { t } = useTranslation()
  
  const backups = useBackups()
  const { createBackup: createNewBackup, restoreBackup: restoreExisting, deleteBackup: deleteOldBackup } = useBackupStore()
  
  const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'security' | 'notifications' | 'subjects'>('general')
  const [name, setName] = useState(schoolName)
  const [logoUrl, setLogoUrl] = useState(logo)
  const [year, setYear] = useState(academicYear)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupName, setBackupName] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  const [syncCountdown, setSyncCountdown] = useState<number | null>(null)
  const [syncStatus, setSyncStatus] = useState<string>('')
  
  // 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFAQRCode, setTwoFAQRCode] = useState('')
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([])
  const [twoFAVerificationCode, setTwoFAVerificationCode] = useState('')
  const [twoFADisableCode, setTwoFADisableCode] = useState('')

  useEffect(() => {
    setYear(academicYear)
  }, [academicYear])

  const logoInputRef = useRef<HTMLInputElement>(null)
  const [subjectName, setSubjectName] = useState('')

  const handleSaveSchoolInfo = () => {
    setSchoolInfo(name, logoUrl, year)
    alert('✅ School information saved!')
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setLogoUrl(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert('⚠️ Veuillez entrer un nom pour la sauvegarde')
      return
    }

    setIsCreatingBackup(true)
    try {
      const monthlyPaymentsState = useMonthlyPaymentsStore.getState()
      const paymentsState = usePaymentsStore.getState()
      
      const backupData = {
        teachers,
        students,
        replacements,
        customSubjects,
        monthlyPayments: monthlyPaymentsState.payments,
        studentConfigs: monthlyPaymentsState.studentConfigs,
        generalPayments: paymentsState.payments,
        paymentRecords: paymentsState.records
      }

      await createNewBackup(
        backupData,
        backupName || `Sauvegarde - ${new Date().toLocaleDateString('fr-FR')}`,
        backupDescription || 'Sauvegarde manuelle',
        user?.uid || '',
        user?.displayName || user?.email || 'Admin'
      )

      alert('✅ Sauvegarde créée avec succès!')
      setBackupName('')
      setBackupDescription('')
    } catch (error) {
      alert('❌ Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir restaurer cette sauvegarde? Les données actuelles seront remplacées.')) {
      try {
        const success = await restoreExisting(backupId)
        if (success) {
          alert('✅ Sauvegarde restaurée avec succès!')
          setTimeout(() => window.location.reload(), 1000)
        }
      } catch (error) {
        alert('❌ Erreur lors de la restauration')
        console.error(error)
      }
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      try {
        await deleteOldBackup(backupId)
        alert('✅ Sauvegarde supprimée')
      } catch (error) {
        alert('❌ Erreur lors de la suppression')
        console.error(error)
      }
    }
  }

  const handleExportBackup = () => {
    const baseBackupJson = exportBackup()
    const baseBackup = JSON.parse(baseBackupJson)
    const monthlyPaymentsState = useMonthlyPaymentsStore.getState()
    const paymentsState = usePaymentsStore.getState()
    
    const fullBackup = {
      ...baseBackup,
      monthlyPayments: monthlyPaymentsState.payments,
      studentConfigs: monthlyPaymentsState.studentConfigs,
      generalPayments: paymentsState.payments,
      paymentRecords: paymentsState.records
    }
    
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-full-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string
          const parsed = JSON.parse(result)
          const fullBackup = parsed.state || parsed
          
          console.log('📦 Importing full backup...', fullBackup)

          const success = await importBackup(JSON.stringify(fullBackup))
          
          if (success) {
            if (fullBackup.monthlyPayments || fullBackup.studentConfigs) {
              const mpStore = useMonthlyPaymentsStore.getState()
              mpStore.importData({
                payments: fullBackup.monthlyPayments || [],
                studentConfigs: fullBackup.studentConfigs || [],
                lastReceiptNumber: fullBackup.lastReceiptNumber || 'REC-2025-00000',
                academicYear: fullBackup.academicYear || mpStore.academicYear
              })
            }

            try {
              setSyncStatus('🔄 Preparing Cloud Sync...')
              setSyncCountdown(30)
              
              const timer = setInterval(() => {
                setSyncCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : 0)
              }, 1000)

              setSyncStatus('🚀 Syncing Database to Supabase...')
              await syncAllToSupabase()
              
              clearInterval(timer)
              setSyncCountdown(null)
              setSyncStatus('✅ Sync Completed!')
            } catch (err) {
              console.error('Final sync failed:', err)
              setSyncCountdown(null)
            }

            alert('✅ Backup imported and synced successfully!')
            setTimeout(() => window.location.reload(), 1000)
          } else {
            alert('❌ Invalid backup file format.')
          }
        } catch (error) {
          console.error('Import error:', error)
          alert('❌ Error reading backup file.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleClearStudents = () => {
    if (window.confirm('⚠️ Are you sure?')) {
      clearAllStudents()
      alert('✅ Cleared.')
    }
  }

  const handleClearReplacements = () => {
    if (window.confirm('⚠️ Are you sure?')) {
      clearAllReplacements()
      alert('✅ Cleared.')
    }
  }

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectName.trim()) return
    if (customSubjects.some(s => s.name.toLowerCase() === subjectName.trim().toLowerCase())) {
      alert('❌ Exists.')
      return
    }
    addCustomSubject(subjectName.trim())
    setSubjectName('')
  }

  const [notificationSettings, setNotificationSettings] = useState({
    enableDesktop: true,
    enableSound: true,
    enableTimetableChanges: true,
    enableReplacements: true,
    enableMessages: true,
    enableAnnouncements: true,
    enableSystemNotifications: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  })

  return (
    <div className="settings-extended" key="settings-root">
      {/* Sync Status Overlay - Stable CSS Visibility */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        transition: 'opacity 0.4s ease',
        opacity: syncCountdown !== null ? 1 : 0,
        visibility: syncCountdown !== null ? 'visible' : 'hidden',
        pointerEvents: syncCountdown !== null ? 'all' : 'none'
      }}>
        <div style={{ 
          width: '70px', 
          height: '70px', 
          border: '6px solid #222', 
          borderTop: '6px solid #4f46e5', 
          borderRadius: '50%', 
          animation: 'sync-spin 1s linear infinite',
          marginBottom: '2rem'
        }}></div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{syncStatus}</h2>
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#4f46e5' }}>
          {syncCountdown ?? 0}s
        </div>
      </div>
      
      <div className="page-header">
        <h1 className="page-title">⚙️ {t('nav.settings')}</h1>
        <p className="page-subtitle">Configure your application</p>
      </div>

      <div className="settings-tabs">
        {['general', 'backup', 'security', 'notifications', 'subjects'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-grid" key="tab-general">
            <div className="settings-card">
              <h2 className="card-title">🏫 School Information</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="schoolNameInput">{t('settings.schoolName')}</label>
                <input id="schoolNameInput" name="schoolName" type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="academicYearInput">{t('settings.academicYear')}</label>
                <input id="academicYearInput" name="academicYear" type="text" className="input" placeholder="2025-2026" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="logoUrlInput">Logo URL</label>
                <input id="logoUrlInput" name="logoUrl" type="url" className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleSaveSchoolInfo}>💾 Save Changes</button>
            </div>
            
            <div className="settings-card large">
              <h2 className="card-title">💾 Data Management</h2>
              <div className="setting-item">
                <div className="setting-info"><h3>Export Backup</h3><p>JSON file download</p></div>
                <button className="btn btn-secondary" onClick={handleExportBackup}>📥 Export</button>
              </div>
              <div className="setting-item">
                <div className="setting-info"><h3>Import Backup</h3><p>Restore from JSON</p></div>
                <label className="btn btn-secondary">📤 Import<input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} /></label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="settings-grid" key="tab-backup">
            <div className="settings-card">
              <h2 className="card-title">💾 Créer une sauvegarde</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="backupNameInput">Nom</label>
                <input id="backupNameInput" name="backupName" type="text" className="input" value={backupName} onChange={(e) => setBackupName(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleCreateBackup} disabled={isCreatingBackup}>
                {isCreatingBackup ? '⏳ ...' : '💾 Créer'}
              </button>
            </div>
            <div className="settings-card">
              <h2 className="card-title">📋 Sauvegardes</h2>
              <div className="backups-list">
                {backups.map((b) => (
                  <div key={b.id} className="backup-item">
                    <span>{b.name}</span>
                    <button onClick={() => handleRestoreBackup(b.id)}>↩️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-grid" key="tab-security">
            <div className="settings-card">
              <h2 className="card-title">🔐 Double Authentification</h2>
              <button className="btn btn-primary" onClick={handleEnable2FA}>🔐 Activer 2FA</button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-grid" key="tab-notifications">
            <div className="settings-card">
              <h2 className="card-title">🔔 Notifications</h2>
              <label><input type="checkbox" checked={notificationSettings.enableDesktop} onChange={(e) => setNotificationSettings({...notificationSettings, enableDesktop: e.target.checked})} /> Enable Desktop</label>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="settings-grid" key="tab-subjects">
            <div className="settings-card large">
              <h2 className="card-title">📚 Subject Management</h2>
              <form onSubmit={handleAddSubject} className="add-subject-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="newSubjectInput">New Subject</label>
                  <input id="newSubjectInput" name="subjectName" type="text" className="input" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary">➕ Add</button>
              </form>
              <div className="subjects-grid">
                {customSubjects.map(s => (
                  <div key={s.id} className="subject-item">
                    <span>{s.name}</span>
                    <button onClick={() => deleteCustomSubject(s.id)}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {show2FAModal && (
        <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔐 Configuration 2FA</h2>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFAQRCode)}`} alt="QR" />
            <button onClick={handleVerify2FA}>✅ Activer</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsExtended
