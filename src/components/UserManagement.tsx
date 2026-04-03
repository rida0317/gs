// src/components/UserManagement.tsx - Gestion des utilisateurs avec Liste

import React, { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { UserRole } from '../types'
import './UserManagement.css'

const UserManagement: React.FC = () => {
  const { user, signup, userData, getAllProfiles } = useAuth()
  const navigate = useNavigate()
  
  const [profiles, setProfiles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'teacher' as UserRole
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingProfile, setEditingProfile] = useState<any | null>(null)
  const { updateProfile, deleteProfile } = useAuth()

  // Charger les profils
  const loadProfiles = async () => {
    setFetchLoading(true)
    const data = await getAllProfiles()
    setProfiles(data)
    setFetchLoading(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const canCreateUsers = userData?.role === 'admin' || userData?.role === 'director'

  if (!canCreateUsers) {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-container">
          <div className="unauthorized-icon">🚫</div>
          <h1>Accès Non Autorisé</h1>
          <p>Seuls les administrateurs et directeurs peuvent créer des comptes.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            🏠 Retour au Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('❌ Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      if (editingProfile) {
        // Update mode
        await updateProfile(editingProfile.id, {
          full_name: formData.displayName,
          role: formData.role
        })
        setSuccess(`✅ Utilisateur "${formData.displayName}" mis à jour!`)
        setEditingProfile(null)
      } else {
        // Create mode
        await signup(formData.email, formData.password, formData.displayName, formData.role)
        setSuccess(`✅ Utilisateur "${formData.displayName}" créé avec succès!`)
      }
      
      setFormData({ email: '', password: '', confirmPassword: '', displayName: '', role: 'teacher' })
      loadProfiles() // Rafraîchir la liste
    } catch (err: any) {
      setError(`❌ Erreur: ${err.message || 'Une erreur est survenue'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (profile: any) => {
    setEditingProfile(profile)
    setFormData({
      email: profile.email || '',
      password: '', // We don't edit password here for security/simplicity
      confirmPassword: '',
      displayName: profile.full_name || '',
      role: profile.role as UserRole
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${name}" ?`)) return

    try {
      await deleteProfile(id)
      setSuccess(`✅ Utilisateur "${name}" supprimé`)
      loadProfiles()
    } catch (err: any) {
      setError(`❌ Erreur lors de la suppression: ${err.message}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingProfile(null)
    setFormData({ email: '', password: '', confirmPassword: '', displayName: '', role: 'teacher' })
  }

  const getRoleLabel = (role: string): string => {
    const labels: any = {
      admin: '👑 Admin',
      director: '👨‍💼 Directeur',
      teacher: '👨‍🏫 Professeur',
      guard: '👮 Garde'
    }
    return labels[role] || role
  }

  return (
    <div className="user-management-page">
      <div className="user-management-container">
        <h1>👥 Gestion des Utilisateurs</h1>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="management-grid">
          {/* Formulaire de création */}
          <div className="management-card">
            <h3>➕ Créer un compte</h3>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Nom complet</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="teacher">👨‍🏫 Professeur</option>
                  <option value="director">👨‍💼 Directeur</option>
                  <option value="admin">👑 Administrateur</option>
                </select>
              </div>

              {!editingProfile && (
                <>
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmer</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-actions-horizontal">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Traitement...' : editingProfile ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                </button>
                {editingProfile && (
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Liste des utilisateurs */}
          <div className="management-card">
            <h3>📋 Utilisateurs existants ({profiles.length})</h3>
            {fetchLoading ? (
              <p>Chargement...</p>
            ) : profiles.length === 0 ? (
              <div className="empty-state">
                <p>Aucun profil trouvé dans la base de données.</p>
                <p style={{fontSize: '0.8rem', color: 'orange'}}>⚠️ Vérifiez si la table "profiles" est remplie.</p>
              </div>
            ) : (
              <div className="user-list-scroll">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id} className={editingProfile?.id === p.id ? 'editing-row' : ''}>
                        <td>{p.full_name}</td>
                        <td>{p.email}</td>
                        <td><span className={`role-badge ${p.role}`}>{getRoleLabel(p.role)}</span></td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="action-btn edit" 
                              onClick={() => handleEdit(p)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDelete(p.id, p.full_name)}
                              title="Supprimer"
                              disabled={p.id === user?.id}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
