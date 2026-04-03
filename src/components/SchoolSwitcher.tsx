// src/components/SchoolSwitcher.tsx - School selector component

import React, { useState } from 'react'
import { useSchoolPlatformStore } from '../store/schoolPlatformStore'
import { useAuth } from '../store/AuthContext'
import './SchoolSwitcher.css'

const SchoolSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { currentSchool, currentSchoolId, userSchools, switchSchool, isSwitching } = useSchoolPlatformStore()
  const { user } = useAuth()

  const handleSwitchSchool = async (schoolId: string) => {
    if (schoolId === currentSchoolId) return
    
    try {
      await switchSchool(schoolId)
      setIsOpen(false)
      
      // Reload the page to refresh all data with new school context
      window.location.reload()
    } catch (error) {
      console.error('Error switching school:', error)
    }
  }

  if (!user || userSchools.length === 0) {
    return null
  }

  return (
    <div className="school-switcher-container">
      <button 
        className="school-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
      >
        {currentSchool?.logo ? (
          <img src={currentSchool.logo} alt="Logo" className="school-switcher-logo" />
        ) : (
          <span className="school-switcher-icon">🏫</span>
        )}
        <span className="school-switcher-name">
          {isSwitching ? 'Chargement...' : (currentSchool?.name || 'École')}
        </span>
        <span className={`school-switcher-chevron ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="school-switcher-dropdown">
          <div className="school-switcher-header">
            <span className="header-title">Changer d'école</span>
            <span className="header-count">{userSchools.length} école(s)</span>
          </div>
          
          <div className="school-switcher-list">
            {userSchools.map((school) => (
              <button
                key={school.id}
                className={`school-switcher-item ${school.id === currentSchoolId ? 'active' : ''}`}
                onClick={() => handleSwitchSchool(school.id)}
                disabled={isSwitching}
              >
                {school.logo ? (
                  <img src={school.logo} alt={school.name} className="item-logo" />
                ) : (
                  <span className="item-icon">🏫</span>
                )}
                <div className="item-info">
                  <span className="item-name">{school.name}</span>
                  <span className="item-year">{school.academicYear}</span>
                </div>
                {school.id === currentSchoolId && (
                  <span className="item-check">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="school-switcher-footer">
            <button className="add-school-btn">
              + Nouvelle école
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolSwitcher
