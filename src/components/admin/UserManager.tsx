// src/components/Admin/UserManager.tsx - User Management for Supabase

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../store/AuthContext'
import type { UserRole } from '../../types'
import './UserManager.css'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  status: 'pending' | 'active' | 'suspended'
  school_id?: string
  phone?: string
  created_at: string
}

const UserManager: React.FC = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      setError('Failed to load users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      
      setSuccess('User role updated successfully!')
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError('Failed to update role: ' + err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error
      
      setSuccess('User status updated successfully!')
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError('Failed to update status: ' + err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  // Delete user (soft delete)
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      // Note: This only deletes from profiles, auth.users needs admin API
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId)

      if (error) throw error
      
      setSuccess('User suspended successfully!')
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError('Failed to delete user: ' + err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) {
    return <div className="user-manager-loading">Loading users...</div>
  }

  return (
    <div className="user-manager">
      <div className="user-manager-header">
        <h1>👥 User Management</h1>
        <button onClick={fetchUsers} className="btn btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>School</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userProfile) => (
              <tr key={userProfile.id}>
                <td>
                  <div className="user-info">
                    <span className="user-name">{userProfile.full_name}</span>
                  </div>
                </td>
                <td>{userProfile.email}</td>
                <td>
                  <select
                    value={userProfile.role}
                    onChange={(e) => updateUserRole(userProfile.id, e.target.value as UserRole)}
                    className="role-select"
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="director">👨‍💼 Director</option>
                    <option value="teacher">👨‍🏫 Teacher</option>
                    <option value="guard">👮 Guard</option>
                    <option value="assistant">📝 Assistant</option>
                    <option value="student">🎓 Student</option>
                    <option value="parent">👪 Parent</option>
                  </select>
                </td>
                <td>
                  <span className={`status-badge status-${userProfile.status}`}>
                    {userProfile.status}
                  </span>
                </td>
                <td>
                  {userProfile.school_id ? (
                    <span className="school-badge">✓ Assigned</span>
                  ) : (
                    <span className="school-badge no-school">No School</span>
                  )}
                </td>
                <td>{new Date(userProfile.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => setEditingUser(userProfile)}
                      className="btn btn-sm btn-primary"
                      title="Edit User"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteUser(userProfile.id)}
                      className="btn btn-sm btn-danger"
                      title="Suspend User"
                    >
                      🗑️ Suspend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User: {editingUser.full_name}</h2>
              <button onClick={() => setEditingUser(null)} className="btn-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>User ID</label>
                <input type="text" value={editingUser.id} disabled className="input-disabled" />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editingUser.full_name} disabled className="input-disabled" />
                <small>To change name, user must update in profile settings</small>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editingUser.email} disabled className="input-disabled" />
                <small>To change email, user must update in profile settings</small>
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => {
                    setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                    updateUserRole(editingUser.id, e.target.value as UserRole)
                  }}
                  className="input"
                >
                  <option value="admin">👑 Admin</option>
                  <option value="director">👨‍💼 Director</option>
                  <option value="teacher">👨‍🏫 Teacher</option>
                  <option value="guard">👮 Guard</option>
                  <option value="assistant">📝 Assistant</option>
                  <option value="student">🎓 Student</option>
                  <option value="parent">👪 Parent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => {
                    setEditingUser({ ...editingUser, status: e.target.value as any })
                    updateUserStatus(editingUser.id, e.target.value as any)
                  }}
                  className="input"
                >
                  <option value="active">✅ Active</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="suspended">❌ Suspended</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={editingUser.phone || 'Not set'} disabled className="input-disabled" />
              </div>

              <div className="form-group">
                <label>Created At</label>
                <input 
                  type="text" 
                  value={new Date(editingUser.created_at).toLocaleString()} 
                  disabled 
                  className="input-disabled" 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-cards">
          <div className="action-card" onClick={() => window.open('/signup', '_blank')}>
            <span className="action-icon">➕</span>
            <span>Create New User</span>
          </div>
          <div className="action-card" onClick={fetchUsers}>
            <span className="action-icon">🔄</span>
            <span>Refresh List</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManager
