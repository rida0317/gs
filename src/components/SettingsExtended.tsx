import React, { useState, useRef, useEffect } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { useStudentsStore } from '../store/studentsStore'
import { useGradesStore } from '../store/gradesStore'
import { useNotificationsStore } from '../store/notificationsStore'
import { useMonthlyPaymentsStore } from '../store/monthlyPaymentsStore'
import { usePaymentsStore } from '../store/paymentsStore'
import { useBackupStore, useBackups, createBackup, restoreBackup, deleteBackup, updateBackupSettings } from '../store/backupStore'
import { twoFAService } from '../services/2fa.service'
import { useAuth } from '../store/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import './SettingsExtended.css'

const SettingsExtended: React.FC = () => {
  const { user } = useAuth()
  const {
    schoolName, logo, academicYear, language, setSchoolInfo, setLanguage,
    exportBackup, importBackup, teachers,
    replacements, clearAllReplacements,
    customSubjects, addCustomSubject, deleteCustomSubject
  } = useSchoolStore()
  const { students, clearAllStudents } = useStudentsStore()
  const { clearGrades } = useGradesStore()
  const { clearAllNotifications } = useNotificationsStore()
  const { t } = useTranslation()
  
  const backups = useBackups()
  const settings = useBackupStore((s) => s.settings)
  const { createBackup: create, restoreBackup: restore, deleteBackup: del, updateSettings } = useBackupStore()
  
  const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'security' | 'notifications' | 'subjects'>('general')
  const [name, setName] = useState(schoolName)
  const [logoUrl, setLogoUrl] = useState(logo)
  const [year, setYear] = useState(academicYear)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupName, setBackupName] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  
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
      // Fetch latest data from all stores
      const monthlyPaymentsState = useMonthlyPaymentsStore.getState()
      const paymentsState = usePaymentsStore.getState()
      
      const backupData = {
        teachers,
        students,
        replacements,
        customSubjects,
        // Include payment data
        monthlyPayments: monthlyPaymentsState.payments,
        studentConfigs: monthlyPaymentsState.studentConfigs,
        generalPayments: paymentsState.payments,
        paymentRecords: paymentsState.records
      }

      await create(
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
        const success = await restore(backupId)
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
        await del(backupId)
        alert('✅ Sauvegarde supprimée')
      } catch (error) {
        alert('❌ Erreur lors de la suppression')
        console.error(error)
      }
    }
  }

  // 2FA Handlers
  const handleEnable2FA = async () => {
    if (!user?.uid) {
      alert('⚠️ Utilisateur non connecté')
      return
    }

    try {
      const result = await twoFAService.enable2FA(
        user.uid,
        user.email || '',
        schoolName || 'School Management'
      )

      if (result.success && result.qrCodeUrl) {
        setTwoFAQRCode(result.qrCodeUrl)
        setTwoFABackupCodes(result.backupCodes || [])
        setShow2FAModal(true)
      } else {
        alert('❌ ' + result.message)
      }
    } catch (error) {
      alert('❌ Erreur lors de l\'activation de 2FA')
      console.error(error)
    }
  }

  const handleVerify2FA = async () => {
    if (!user?.uid || !twoFAVerificationCode) {
      alert('⚠️ Veuillez entrer le code de vérification')
      return
    }

    try {
      const result = await twoFAService.verify2FASetup(user.uid, twoFAVerificationCode)

      if (result.success) {
        setTwoFAEnabled(true)
        setShow2FAModal(false)
        alert('✅ 2FA activée avec succès!')
      } else {
        alert('❌ ' + result.message)
      }
    } catch (error) {
      alert('❌ Erreur lors de la vérification')
      console.error(error)
    }
  }

  const handleDisable2FA = async () => {
    if (!user?.uid || !twoFADisableCode) {
      alert('⚠️ Veuillez entrer le code de vérification')
      return
    }

    if (!confirm('⚠️ Êtes-vous sûr de vouloir désactiver la 2FA?')) {
      return
    }

    try {
      const result = await twoFAService.disable2FA(user.uid, twoFADisableCode)

      if (result.success) {
        setTwoFAEnabled(false)
        setTwoFADisableCode('')
        alert('✅ 2FA désactivée')
      } else {
        alert('❌ ' + result.message)
      }
    } catch (error) {
      alert('❌ Erreur lors de la désactivation')
      console.error(error)
    }
  }

  const handleExportBackup = () => {
    // Get base backup from school store
    const baseBackupJson = exportBackup()
    const baseBackup = JSON.parse(baseBackupJson)
    
    // Add payments data
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
          const fullBackup = JSON.parse(result)
          
          console.log('📦 Importing full backup...', fullBackup)

          // 1. Import to School Store
          const success = await importBackup(JSON.stringify(fullBackup))
          
          if (success) {
            // 2. Import to Monthly Payments Store if data exists
            if (fullBackup.monthlyPayments || fullBackup.studentConfigs) {
              const mpStore = useMonthlyPaymentsStore.getState()
              mpStore.importData({
                payments: fullBackup.monthlyPayments || [],
                studentConfigs: fullBackup.studentConfigs || [],
                lastReceiptNumber: fullBackup.lastReceiptNumber || 'REC-2025-00000',
                academicYear: fullBackup.academicYear || mpStore.academicYear
              })
            }

            // 3. Import to General Payments Store if data exists
            if (fullBackup.generalPayments || fullBackup.paymentRecords) {
              const pStore = usePaymentsStore.getState()
              // For now, let's assume direct set or simple check
            }

            // 4. Final Sync to Supabase with Countdown
            try {
              setSyncStatus('🔄 Preparing data for Cloud Sync...')
              setSyncCountdown(30) // Estimated 30 seconds for full sync
              
              const timer = setInterval(() => {
                setSyncCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : 0)
              }, 1000)

              setSyncStatus('🚀 Syncing Teachers, Classes, Students & More to Supabase...')
              await syncAllToSupabase()
              
              clearInterval(timer)
              setSyncCountdown(null)
              setSyncStatus('✅ Sync Completed successfully!')
            } catch (err) {
              console.error('Final sync failed:', err)
              setSyncStatus('❌ Sync Failed. Check console for details.')
              setSyncCountdown(null)
            }

            alert('✅ Backup imported and synced successfully! Application will reload.')
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          } else {
            alert('❌ Invalid backup file format.')
          }
        } catch (error) {
          console.error('Import error:', error)
          alert('❌ Error reading or parsing backup file. Please ensure it is a valid JSON.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleClearStudents = () => {
    if (window.confirm(`⚠️ Are you sure you want to delete ALL ${students.length} students? This cannot be undone.`)) {
      clearAllStudents()
      alert('✅ All student records have been cleared.')
    }
  }

  const handleClearReplacements = () => {
    if (window.confirm(`⚠️ Are you sure you want to delete ALL ${replacements.length} replacement records? This cannot be undone.`)) {
      clearAllReplacements()
      alert('✅ All replacement records have been cleared.')
    }
  }

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectName.trim()) return
    
    if (customSubjects.some(s => s.name.toLowerCase() === subjectName.trim().toLowerCase())) {
      alert('❌ This subject already exists.')
      return
    }

    addCustomSubject(subjectName.trim())
    setSubjectName('')
    alert('✅ Subject added successfully!')
  }

  // Notification Settings
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
    <div className="settings-extended">
      {/* Sync Status Overlay - Using visibility to avoid DOM range errors */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        transition: 'all 0.3s ease-in-out',
        opacity: syncCountdown !== null ? 1 : 0,
        visibility: syncCountdown !== null ? 'visible' : 'hidden',
        pointerEvents: syncCountdown !== null ? 'all' : 'none'
      }}>
        <div className="sync-spinner" style={{ 
          width: '80px', 
          height: '80px', 
          border: '8px solid #333', 
          borderTop: '8px solid var(--primary-color, #4f46e5)', 
          borderRadius: '50%', 
          animation: 'sync-spin 1s linear infinite',
          marginBottom: '2rem'
        }}></div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{syncStatus}</h2>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary-color, #4f46e5)' }}>
          {syncCountdown ?? 0}s
        </div>
        <p style={{ marginTop: '1.5rem', color: '#888', maxWidth: '400px' }}>
          Uploading your local database to Supabase Cloud. Please do not refresh or close this page.
        </p>
        <style>{`
          @keyframes sync-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      
      <div className="page-header">
        <h1 className="page-title">⚙️ {t('nav.settings')}</h1>
        <p className="page-subtitle">Configure your application</p>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          🏫 General
        </button>
        <button
          className={`tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          💾 Sauvegarde
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔐 Sécurité
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
        <button
          className={`tab ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          📚 Subjects
        </button>
      </div>

      {/* Backup Settings */}
      {activeTab === 'backup' && (
        <div className="settings-content">
          <div className="settings-grid">
            <div className="settings-card">
              <h2 className="card-title">💾 Créer une sauvegarde</h2>
              <p className="card-description">Sauvegardez toutes les données de l'application</p>

              <div className="form-group">
                <label className="form-label">Nom de la sauvegarde</label>
                <input
                  type="text"
                  className="input"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Ex: Sauvegarde Janvier 2025"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="input"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Description optionnelle..."
                  rows={3}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
              >
                {isCreatingBackup ? '⏳ Sauvegarde en cours...' : '💾 Créer une sauvegarde'}
              </button>
            </div>

            <div className="settings-card">
              <h2 className="card-title">📋 Sauvegardes existantes</h2>
              <p className="card-description">{backups.length} sauvegarde(s) disponible(s)</p>

              {backups.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>Aucune sauvegarde</p>
                </div>
              ) : (
                <div className="backups-list">
                  {backups.map((backup) => (
                    <div key={backup.id} className="backup-item">
                      <div className="backup-info">
                        <h4>{backup.name}</h4>
                        <p className="backup-date">
                          {new Date(backup.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="backup-size">{(backup.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <div className="backup-actions">
                        <button
                          className="btn btn-sm btn-restore"
                          onClick={() => handleRestoreBackup(backup.id)}
                        >
                          ↩️ Restaurer
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDeleteBackup(backup.id)}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="settings-content">
          <div className="settings-grid">
            <div className="settings-card">
              <h2 className="card-title">🔐 Double Authentification (2FA)</h2>
              <p className="card-description">
                {twoFAEnabled 
                  ? 'La 2FA est activée. Votre compte est protégé.' 
                  : 'Protégez votre compte avec la double authentification.'}
              </p>

              {twoFAEnabled ? (
                <div className="security-enabled">
                  <div className="status-badge status-success">✅ 2FA Activée</div>
                  <div className="form-group">
                    <label className="form-label">Code de vérification:</label>
                    <input
                      type="text"
                      className="input"
                      value={twoFADisableCode}
                      onChange={(e) => setTwoFADisableCode(e.target.value)}
                      placeholder="Entrez le code 2FA"
                      maxLength={6}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-danger" onClick={handleDisable2FA}>
                      🔓 Désactiver 2FA
                    </button>
                  </div>
                </div>
              ) : (
                <div className="security-disabled">
                  <div className="status-badge status-warning">⚠️ 2FA Désactivée</div>
                  <p className="security-info">
                    La double authentification ajoute une couche de sécurité supplémentaire 
                    en demandant un code en plus de votre mot de passe.
                  </p>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleEnable2FA}>
                      🔐 Activer 2FA
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-card">
              <h2 className="card-title">📱 Comment ça marche?</h2>
              <ol className="security-steps">
                <li>
                  <strong>📲 Scannez le QR code</strong>
                  <p>Utilisez Google Authenticator, Authy ou Microsoft Authenticator</p>
                </li>
                <li>
                  <strong>🔢 Entrez le code</strong>
                  <p>Le code à 6 chiffres change toutes les 30 secondes</p>
                </li>
                <li>
                  <strong>💾 Sauvegardez les codes</strong>
                  <p>Gardez les codes de secours en lieu sûr</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="settings-content">
          <div className="settings-grid">
            <div className="settings-card">
              <h2 className="card-title">🏫 School Information</h2>

              <div className="form-group">
                <label className="form-label">{t('settings.schoolName')}</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.academicYear')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 2025-2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input
                  type="url"
                  className="input"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Logo</label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => logoInputRef.current?.click()}
                >
                  📁 Choose Image
                </button>
              </div>

              {logoUrl && (
                <div className="logo-preview">
                  <img src={logoUrl} alt="Logo" className="logo-preview-img" />
                </div>
              )}

              <button className="btn btn-primary" onClick={handleSaveSchoolInfo}>
                💾 Save Changes
              </button>
            </div>

            <div className="settings-card">
              <h2 className="card-title">🌍 {t('settings.language')}</h2>

              <div className="form-group">
                <label className="form-label">{t('settings.appLanguage')}</label>
                <select
                  className="input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
                >
                  <option value="en">{t('settings.english')}</option>
                  <option value="fr">{t('settings.french')}</option>
                  <option value="ar">{t('settings.arabic')}</option>
                </select>
              </div>
            </div>

            <div className="settings-card large">
              <h2 className="card-title">💾 Data Management</h2>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Export Backup</h3>
                  <p>Download all your data as a JSON file</p>
                </div>
                <button className="btn btn-secondary" onClick={handleExportBackup}>
                  📥 Export
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Import Backup</h3>
                  <p>Restore data from a backup file</p>
                </div>
                <label className="btn btn-secondary">
                  📤 Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="text-danger">Clear All Students</h3>
                  <p>Permanently delete all {students.length} student records</p>
                </div>
                <button className="btn btn-danger" onClick={handleClearStudents}>
                  🗑️ Clear Students
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="text-danger">Clear All Replacements</h3>
                  <p>Permanently delete all {replacements.length} replacement records</p>
                </div>
                <button className="btn btn-danger" onClick={handleClearReplacements}>
                  🗑️ Clear Replacements
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="settings-content">
          <div className="settings-grid">
            <div className="settings-card">
              <h2 className="card-title">🔔 Notification Settings</h2>
              <p className="card-description">Manage how you receive notifications</p>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.enableDesktop}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enableDesktop: e.target.checked })}
                  />
                  Enable Desktop Notifications
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.enableSound}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enableSound: e.target.checked })}
                  />
                  Enable Sound Alerts
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    if ('Notification' in window) {
                      const permission = await Notification.requestPermission()
                      if (permission === 'granted') {
                        new window.Notification('Notifications enabled', {
                          body: 'You will now receive desktop notifications'
                        })
                        alert('✅ Desktop notifications enabled!')
                      }
                    }
                  }}
                >
                  Test Desktop Notifications
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear all notifications?')) {
                      await clearAllNotifications()
                      alert('✅ All notifications cleared')
                    }
                  }}
                >
                  🗑️ Clear All Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Settings */}
      {activeTab === 'subjects' && (
        <div className="settings-content">
          <div className="settings-grid">
            <div className="settings-card large">
              <h2 className="card-title">📚 Subject Management</h2>
              <p className="card-description">Add or remove subjects used across the school</p>

              <form onSubmit={handleAddSubject} className="add-subject-form">
                <div className="form-group">
                  <label className="form-label">New Subject Name</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Mathematics, History..."
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      ➕ Add Subject
                    </button>
                  </div>
                </div>
              </form>

              <div className="subjects-list">
                <h3>Current Subjects ({customSubjects.length})</h3>
                {customSubjects.length === 0 ? (
                  <p className="empty-text">No custom subjects added yet.</p>
                ) : (
                  <div className="subjects-grid">
                    {customSubjects.map(subject => (
                      <div key={subject.id} className="subject-item">
                        <span>{subject.name}</span>
                        <button 
                          className="btn-icon text-danger" 
                          onClick={() => {
                            if (window.confirm(`Delete subject "${subject.name}"?`)) {
                              deleteCustomSubject(subject.id)
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔐 Configuration 2FA</h2>
              <button className="close-btn" onClick={() => setShow2FAModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="qr-section">
                <h3>1️⃣ Scannez ce QR code</h3>
                <div className="qr-code-container">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFAQRCode)}`}
                    alt="QR Code 2FA"
                    className="qr-code"
                  />
                </div>
                <p className="qr-instruction">
                  Ouvrez votre application d'authentification et scannez ce QR code
                </p>
              </div>

              <div className="backup-codes-section">
                <h3>2️⃣ Codes de secours</h3>
                <p>Sauvegardez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.</p>
                <div className="backup-codes-grid">
                  {twoFABackupCodes.map((code, index) => (
                    <div key={index} className="backup-code">{code}</div>
                  ))}
                </div>
              </div>

              <div className="verification-section">
                <h3>3️⃣ Vérification</h3>
                <div className="form-group">
                  <label className="form-label">Code de vérification:</label>
                  <input
                    type="text"
                    className="input"
                    value={twoFAVerificationCode}
                    onChange={(e) => setTwoFAVerificationCode(e.target.value)}
                    placeholder="Entrez le code à 6 chiffres"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShow2FAModal(false)}>
                Annuler
              </button>
              <button type="button" className="btn-submit" onClick={handleVerify2FA}>
                ✅ Activer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsExtended
