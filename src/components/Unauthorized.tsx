// src/components/Unauthorized.tsx - Page displayed when user doesn't have permission

import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Unauthorized: React.FC = () => {
  const location = useLocation()
  const { message, requiredRoles, userRole } = location.state || {}

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-icon">🚫</div>
        <h1>Accès Non Autorisé</h1>
        <p className="unauthorized-message">
          {message || '❌ Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'}
        </p>
        
        {userRole && (
          <div className="user-role-info">
            <p><strong>Votre rôle:</strong> <span className="role-badge">{userRole}</span></p>
          </div>
        )}
        
        {requiredRoles && requiredRoles.length > 0 && (
          <div className="required-roles-info">
            <p><strong>Rôles requis:</strong></p>
            <div className="roles-list">
              {requiredRoles.map((role: string) => (
                <span key={role} className="role-badge required">{role}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className="unauthorized-actions">
          <Link to="/dashboard" className="btn btn-primary">
            🏠 Retour au Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary">
            🏠 Page d'accueil
          </Link>
        </div>
      </div>
      
      <style>{`
        .unauthorized-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          padding: 2rem;
        }
        
        .unauthorized-container {
          text-align: center;
          max-width: 500px;
          background: var(--card-bg);
          padding: 3rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        
        .unauthorized-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
        }
        
        .unauthorized-page h1 {
          color: var(--text-color);
          margin-bottom: 1rem;
        }
        
        .unauthorized-message {
          color: var(--text-muted);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }
        
        .user-role-info,
        .required-roles-info {
          background: var(--bg-color);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }
        
        .role-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          background: var(--primary-color);
          color: white;
          margin: 0.25rem;
        }
        
        .role-badge.required {
          background: #ef4444;
        }
        
        .roles-list {
          margin-top: 0.5rem;
        }
        
        .unauthorized-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition);
        }
        
        .btn-primary {
          background: var(--primary-color);
          color: white;
        }
        
        .btn-primary:hover {
          background: var(--primary-color-dark);
        }
        
        .btn-secondary {
          background: transparent;
          color: var(--text-color);
          border: 2px solid var(--border-color);
        }
        
        .btn-secondary:hover {
          background: var(--bg-color);
        }
      `}</style>
    </div>
  )
}

export default Unauthorized
