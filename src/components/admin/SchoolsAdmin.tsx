// src/components/admin/SchoolsAdmin.tsx - School Management Admin Panel

import React, { useState, useEffect } from 'react'
import { useSchoolPlatformStore } from '../../store/schoolPlatformStore'
import { useAuth } from '../../store/AuthContext'
import { 
  createSchool, 
  updateSchool, 
  addUserToSchool,
  generateSchoolCode 
} from '../../services/school.service'
import type { School, SchoolSettings } from '../../types/school'
import './SchoolsAdmin.css'

const DEFAULT_SETTINGS: SchoolSettings = {
  language: 'fr',
  currency: 'DH',
  timezone: 'Africa/Casablanca',
  workingDays: [0, 1, 2, 3, 4, 5],
  workingHours: { start: 8, end: 19 },
  levels: ['1AC', '2AC', '3AC', '1BAC', '2BAC'],
  subjects: ['Mathématiques', 'Français', 'Arabe', 'Physique-Chimie', 'SVT', 'Histoire-Géographie'],
  paymentMethods: ['especes', 'cheque', 'virement'],
  emailEnabled: false
}

const SchoolsAdmin: React.FC = () => {
  const { user, userData } = useAuth()
  const { initializeSchools, refreshSchools } = useSchoolPlatformStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    logo: '' as string | null
  })

  const isSuperAdmin = userData?.role === 'admin' || userData?.role === 'director'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-generate code when name changes
    if (name === 'name' && value) {
      setFormData(prev => ({ ...prev, code: generateSchoolCode(value) }))
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSuccess(null)
    setIsCreating(true)

    try {
      // Create school
      const school = await createSchool({
        name: formData.name,
        code: formData.code || generateSchoolCode(formData.name),
        logo: formData.logo || undefined,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        academicYear: formData.academicYear,
        isActive: true,
        settings: DEFAULT_SETTINGS
      })

      // Add current user as admin
      await addUserToSchool(user.uid, school.id, 'admin')

      // Refresh schools list
      await refreshSchools(user.uid)

      setSuccess(`École "${school.name}" créée avec succès!`)
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        logo: null
      })
      
      setShowCreateModal(false)
    } catch (err: any) {
      console.error('Error creating school:', err)
      setError(err.message || 'Erreur lors de la création de l\'école')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="schools-admin-container">
        <div className="admin-error">
          <h2>⛔ Accès non autorisé</h2>
          <p>Seuls les administrateurs peuvent gérer les écoles.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="schools-admin-container">
      <div className="admin-header">
        <h1>🏫 Gestion des Écoles</h1>
        <button 
          className="btn-create-school"
          onClick={() => setShowCreateModal(true)}
        >
          + Nouvelle École
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅</span> {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Create School Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-school-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏫 Créer une Nouvelle École</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* School Name */}
                <div className="form-group">
                  <label htmlFor="name">Nom de l'école *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Les Générations Montantes"
                  />
                </div>

                {/* School Code */}
                <div className="form-group">
                  <label htmlFor="code">Code École *</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: LGM-2026"
                    pattern="[A-Z0-9-]+"
                    title="Lettres majuscules, chiffres et tirets uniquement"
                  />
                  <small>Code unique pour identifier l'école</small>
                </div>

                {/* Logo Upload */}
                <div className="form-group">
                  <label htmlFor="logo">Logo de l'école</label>
                  <div className="logo-upload">
                    {formData.logo ? (
                      <div className="logo-preview">
                        <img src={formData.logo} alt="Logo preview" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <label className="upload-btn">
                        📁 Choisir un fichier
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@ecole.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Téléphone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group">
                  <label htmlFor="address">Adresse</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Adresse complète de l'école"
                  />
                </div>

                {/* Academic Year */}
                <div className="form-group">
                  <label htmlFor="academicYear">Année Académique *</label>
                  <input
                    type="text"
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    required
                    placeholder="2025-2026"
                    pattern="\d{4}-\d{4}"
                    title="Format: YYYY-YYYY"
                  />
                </div>

                {/* Info Box */}
                <div className="info-box">
                  <strong>ℹ️ Paramètres par défaut:</strong>
                  <ul>
                    <li>Langue: Français</li>
                    <li>Devise: DH (Dirham Marocain)</li>
                    <li>Niveaux: 1AC, 2AC, 3AC, 1BAC, 2BAC</li>
                    <li>Modes de paiement: Espèces, Chèque, Virement</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isCreating || !formData.name}
                >
                  {isCreating ? 'Création en cours...' : '✅ Créer l\'école'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolsAdmin
