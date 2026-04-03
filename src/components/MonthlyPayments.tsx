// src/components/MonthlyPayments.tsx - Monthly student payments management

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  useMonthlyPaymentsStore,
  useMonthlyPayments,
  useStudentConfigs,
  MONTHS,
  LEVEL_PRICES,
  TRANSPORT_PRICE,
  ANNUAL_DISCOUNT
} from '../store/monthlyPaymentsStore'
import { useStudents } from '../store/studentsStore'
import { useClasses } from '../store/classesStore'
import { useSchoolStore } from '../store/schoolStore'
import { useAuth } from '../store/AuthContext'
import PaymentReceipt from './PaymentReceipt'
import './MonthlyPayments.css'

type PaymentMethod = 'especes' | 'cheque' | 'virement'

const MonthlyPayments: React.FC = () => {
  const { user } = useAuth()
  const students = useStudents()
  const classes = useClasses()
  const { schoolName, logo } = useSchoolStore()
  
  const payments = useMonthlyPayments()
  const studentConfigs = useStudentConfigs()
  const { 
    markAsPaid, 
    markAsAnnual, 
    undoPayment,
    setStudentTransport, 
    setStudentDiscount,
    getStudentConfig,
    getStudentPayments,
    getStudentStats,
    generateReceiptNumber
  } = useMonthlyPaymentsStore()

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAnnualModal, setShowAnnualModal] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentReceipt, setCurrentReceipt] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState<number>(1)
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'especes' as PaymentMethod,
    notes: ''
  })

  // Load payments from Firebase on mount
  useEffect(() => {
    const loadPayments = async () => {
      try {
        await useMonthlyPaymentsStore.getState().loadFromFirebase()
      } catch (error) {
        console.error('Error loading payments:', error)
      }
    }
    loadPayments()
  }, [])

  const filteredStudents = selectedClassId
    ? students.filter(s => s.classId === selectedClassId)
    : students

  const getClassName = (classId: string) => {
    const classObj = classes.find(c => c.id === classId)
    if (classObj) {
      return classObj.name || classObj.level
    }
    return classId // Fallback to ID if class not found
  }

  // Get class name from student (check student.class first, then student.classId)
  const getStudentClassName = (student: any) => {
    // First try student.class (if exists - direct class name)
    if (student.class) {
      return student.class
    }
    // Then try student.className (if exists)
    if (student.className) {
      return student.className
    }
    // Fallback to getClassName using classId
    return getClassName(student.classId)
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId)
  const studentConfig = selectedStudent ? getStudentConfig(selectedStudent.id, selectedStudent.classId, '') : null
  const studentPayments = selectedStudent ? getStudentPayments(selectedStudent.id, '2025-2026') : []
  const stats = selectedStudent ? getStudentStats(selectedStudent.id, '2025-2026') : null

  const getLevelPrice = (student?: typeof selectedStudent) => {
    if (!student) return 1000
    
    const classLower = student.classId.toLowerCase()
    if (classLower.includes('mat') || classLower.includes('petite') || classLower.includes('moyenne') || classLower.includes('grande')) {
      return LEVEL_PRICES.maternelle
    } else if (classLower.includes('6') || classLower.includes('5') || classLower.includes('4') || classLower.includes('3')) {
      return LEVEL_PRICES.college
    }
    return LEVEL_PRICES.primaire
  }

  const getStudentLevel = (student?: typeof selectedStudent) => {
    if (!student) return 'primaire'
    
    const classLower = student.classId.toLowerCase()
    if (classLower.includes('mat') || classLower.includes('petite') || classLower.includes('moyenne') || classLower.includes('grande')) {
      return 'maternelle'
    } else if (classLower.includes('6') || classLower.includes('5') || classLower.includes('4') || classLower.includes('3')) {
      return 'college'
    }
    return 'primaire'
  }

  const handleOpenPayment = (month: number) => {
    setCurrentMonth(month)
    const basePrice = getLevelPrice(selectedStudent)
    const config = studentConfigs.find(c => c.studentId === selectedStudentId)
    const transport = config?.transportEnabled ? TRANSPORT_PRICE : 0
    const discount = config?.personalizedDiscount || 0
    
    setPaymentData({
      amount: (basePrice + transport - discount).toString(),
      paymentMethod: 'especes',
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const handlePayMonth = async () => {
    if (!selectedStudentId || !paymentData.amount) {
      alert('⚠️ Veuillez remplir les champs obligatoires')
      return
    }

    try {
      const payment = await markAsPaid(
        selectedStudentId,
        currentMonth,
        parseFloat(paymentData.amount),
        paymentData.paymentMethod,
        user?.uid || '',
        user?.displayName || user?.email || 'Administration',
        paymentData.notes
      )

      alert('✅ Paiement enregistré avec succès!')
      setShowPaymentModal(false)
      
      // Show receipt
      setCurrentReceipt({
        receiptNumber: payment.receiptNumber,
        studentName: selectedStudent?.name,
        className: selectedStudent?.classId,
        month: MONTHS[currentMonth - 1],
        amount: payment.paidAmount,
        paymentMethod: payment.paymentMethod,
        paymentDate: new Date(payment.paymentDate!).toLocaleDateString('fr-FR'),
        academicYear: '2025-2026'
      })
      setShowReceipt(true)
    } catch (error) {
      alert('❌ Erreur lors du paiement')
      console.error(error)
    }
  }

  const handlePayAnnual = async () => {
    if (!selectedStudentId) return

    const basePrice = getLevelPrice(selectedStudent)
    const config = studentConfigs.find(c => c.studentId === selectedStudentId)
    const transport = config?.transportEnabled ? TRANSPORT_PRICE : 0
    const discount = config?.personalizedDiscount || 0
    const monthlyTotal = basePrice + transport - discount
    const annualTotal = monthlyTotal * MONTHS.length * (1 - ANNUAL_DISCOUNT)

    if (!confirm(`💰 Paiement annuel: ${annualTotal.toFixed(0)} DH (-10%)\n\nÊtes-vous sûr?`)) {
      return
    }

    try {
      const payments = await markAsAnnual(
        selectedStudentId,
        paymentData.paymentMethod,
        user?.uid || '',
        user?.displayName || user?.email || 'Administration',
        'Paiement annuel -10%'
      )

      alert('✅ Paiement annuel enregistré avec succès!')
      setShowAnnualModal(false)
    } catch (error) {
      alert('❌ Erreur lors du paiement annuel')
      console.error(error)
    }
  }

  const handleUndoPayment = async (paymentId: string) => {
    if (confirm('⚠️ Annuler ce paiement?')) {
      try {
        await undoPayment(paymentId)
        alert('✅ Paiement annulé')
      } catch (error) {
        alert('❌ Erreur')
        console.error(error)
      }
    }
  }

  const handleToggleTransport = () => {
    if (selectedStudentId) {
      const config = studentConfigs.find(c => c.studentId === selectedStudentId)
      setStudentTransport(selectedStudentId, !config?.transportEnabled)
    }
  }

  const handleViewStudentDetails = (student: any) => {
    setSelectedClassId(student.classId)
    setSelectedStudentId(student.studentId)
    setShowStudentDetailsModal(true)
  }

  const getStatusBadge = (month: number) => {
    const payment = studentPayments.find(p => p.month === month)
    
    if (!payment) {
      return <span className="status-badge pending">⏸️ En attente</span>
    }
    
    if (payment.status === 'paid') {
      return (
        <span className="status-badge paid">
          ✅ Payé
          <button 
            className="btn-undo"
            onClick={() => handleUndoPayment(payment.id)}
            title="Annuler"
          >
            ↩️
          </button>
        </span>
      )
    }
    
    return <span className="status-badge pending">⏸️ En attente</span>
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      especes: '💵 Espèces',
      cheque: '📝 Chèque',
      virement: '🏦 Virement'
    }
    return labels[method] || method
  }

  // Get students with pending payments
  const studentsWithPending = useMonthlyPaymentsStore.getState().getStudentsWithPendingPayments(
    students,
    '2025-2026',
    classes
  )

  // Map students with pending to include proper class name
  const studentsWithPendingMapped = studentsWithPending.map(s => ({
    ...s,
    className: getClassName(s.classId)
  }))

  // Filter students with pending by search query
  const filteredStudentsWithPending = studentsWithPendingMapped.filter(student => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    
    return (
      student.studentName.toLowerCase().includes(query) ||
      student.className.toLowerCase().includes(query)
    )
  })

  return (
    <div className="monthly-payments-container">
      <div className="mp-header">
        <div className="header-content">
          <h1>📊 Paiements Mensuels</h1>
          <p>Suivi des mensualités par élève</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mp-filters">
        <div className="filter-group">
          <label>Classe:</label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value)
              setSelectedStudentId(null)
            }}
          >
            <option value="">Toutes les classes</option>
            {students.map(s => getStudentClassName(s)).filter((v, i, a) => a.indexOf(v) === i).map(className => {
              // Find classId for this className
              const studentWithClass = students.find(s => getStudentClassName(s) === className)
              return (
                <option key={studentWithClass?.classId} value={studentWithClass?.classId}>{className}</option>
              )
            })}
          </select>
        </div>

        <div className="filter-group">
          <label>Élève:</label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => setSelectedStudentId(e.target.value || null)}
          >
            <option value="">-- Sélectionner un élève --</option>
            {filteredStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Résumé des élèves en retard de paiement */}
      {studentsWithPendingMapped.length > 0 && (
        <div className="pending-payments-summary">
          <div className="summary-header">
            <h2>⚠️ Élèves en retard de paiement</h2>
            <span className="badge-danger">{studentsWithPendingMapped.length} élève(s)</span>
          </div>
          
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Rechercher un élève par nom ou classe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="summary-table-container">
            <table className="pending-table">
              <thead>
                <tr>
                  <th>Nom de l'élève</th>
                  <th>Classe</th>
                  <th>Mois en retard</th>
                  <th>Montant total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentsWithPending.length > 0 ? (
                  filteredStudentsWithPending.map((student) => (
                    <tr key={student.studentId} className="pending-row">
                      <td className="student-name">{student.studentName}</td>
                      <td className="class-name">{student.className}</td>
                      <td className="pending-months">
                        {student.pendingMonthNames.join(', ')}
                      </td>
                      <td className="total-pending">{student.totalPending.toFixed(0)} DH</td>
                      <td className="action-cell">
                        <button
                          className="btn-view-student"
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          👁️ Voir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="no-results">
                      {searchQuery ? '😕 Aucun élève trouvé pour cette recherche' : '✅ Aucun élève en retard'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Info & Settings */}
      {selectedStudent && studentConfig && stats && (
        <div className="student-info-card">
          <div className="info-header">
            <h2>👨‍🎓 {selectedStudent.name}</h2>
            <div className="info-actions">
              <button className="btn-annual" onClick={() => setShowAnnualModal(true)}>
                💰 Paiement Annuel (-10%)
              </button>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Classe:</label>
              <span>{getStudentClassName(selectedStudent)}</span>
            </div>
            <div className="info-item">
              <label>Niveau:</label>
              <span>{getStudentLevel(selectedStudent).charAt(0).toUpperCase() + getStudentLevel(selectedStudent).slice(1)}</span>
            </div>
            <div className="info-item">
              <label>Mensualité de base:</label>
              <span>{getLevelPrice(selectedStudent)} DH</span>
            </div>
            <div className="info-item">
              <label>Transport:</label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={studentConfig.transportEnabled}
                  onChange={handleToggleTransport}
                />
                {studentConfig.transportEnabled ? '✅ Oui (+200 DH)' : '❌ Non'}
              </label>
            </div>
            <div className="info-item">
              <label>Réduction personnalisée:</label>
              <input
                type="number"
                value={studentConfig.personalizedDiscount}
                onChange={(e) => setStudentDiscount(selectedStudent.id, parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="discount-input"
              />
              <span>DH</span>
            </div>
            <div className="info-item">
              <label>Total mensuel:</label>
              <span className="total-amount">
                {(getLevelPrice(selectedStudent) + (studentConfig.transportEnabled ? TRANSPORT_PRICE : 0) - studentConfig.personalizedDiscount).toFixed(0)} DH
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total annuel</div>
              <div className="stat-value">{stats.total.toFixed(0)} DH</div>
            </div>
            <div className="stat-card paid">
              <div className="stat-label">Payé</div>
              <div className="stat-value">{stats.paid.toFixed(0)} DH</div>
            </div>
            <div className="stat-card remaining">
              <div className="stat-label">Restant</div>
              <div className="stat-value">{stats.remaining.toFixed(0)} DH</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mois payés</div>
              <div className="stat-value">{stats.monthsPaid}/{MONTHS.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {selectedStudent && (
        <div className="payments-table-card">
          <h3>📋 Détail des paiements - {selectedStudent.name}</h3>
          
          <table className="payments-table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Montant</th>
                <th>Payé</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, index) => {
                const monthNum = index + 1
                const payment = studentPayments.find(p => p.month === monthNum)
                
                return (
                  <tr key={monthNum} className={payment?.status === 'paid' ? 'paid-row' : ''}>
                    <td className="month-name">{month}</td>
                    <td className="amount">
                      {(getLevelPrice(selectedStudent) + (studentConfig?.transportEnabled ? TRANSPORT_PRICE : 0) - (studentConfig?.personalizedDiscount || 0)).toFixed(0)} DH
                    </td>
                    <td className="paid-amount">
                      {payment ? payment.paidAmount.toFixed(0) : '0'} DH
                    </td>
                    <td className="payment-date">
                      {payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="payment-method">
                      {payment?.paymentMethod ? getPaymentMethodLabel(payment.paymentMethod) : '-'}
                    </td>
                    <td className="status-cell">
                      {getStatusBadge(monthNum)}
                    </td>
                    <td className="actions-cell">
                      {payment?.status === 'paid' ? (
                        <button
                          className="btn-receipt"
                          onClick={() => {
                            setCurrentReceipt({
                              receiptNumber: payment.receiptNumber,
                              studentName: selectedStudent.name,
                              className: selectedStudent.classId,
                              month: MONTHS[payment.month - 1],
                              amount: payment.paidAmount,
                              paymentMethod: payment.paymentMethod,
                              paymentDate: new Date(payment.paymentDate!).toLocaleDateString('fr-FR'),
                              academicYear: payment.academicYear
                            })
                            setShowReceipt(true)
                          }}
                        >
                          📄 Reçu
                        </button>
                      ) : (
                        <button
                          className="btn-pay"
                          onClick={() => handleOpenPayment(monthNum)}
                        >
                          💳 Payer
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal using Portal */}
      {showPaymentModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Paiement - {MONTHS[currentMonth - 1]}</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Montant (DH):</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mode de paiement:</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="especes">💵 Espèces</option>
                  <option value="cheque">📝 Chèque</option>
                  <option value="virement">🏦 Virement</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optionnel):</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Numéro de chèque, remarques..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handlePayMonth}>
                ✅ Confirmer le paiement
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Annual Payment Modal using Portal */}
      {showAnnualModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAnnualModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Paiement Annuel</h2>
              <button className="close-btn" onClick={() => setShowAnnualModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="annual-info">
                <p><strong>Élève:</strong> {selectedStudent?.name}</p>
                <p><strong>Mensualité:</strong> {getLevelPrice(selectedStudent)} DH</p>
                {studentConfig?.transportEnabled && (
                  <p><strong>Transport:</strong> +{TRANSPORT_PRICE} DH</p>
                )}
                {studentConfig?.personalizedDiscount > 0 && (
                  <p><strong>Réduction:</strong> -{studentConfig.personalizedDiscount} DH</p>
                )}
                <hr />
                <p><strong>Total mois:</strong> {(getLevelPrice(selectedStudent) + (studentConfig?.transportEnabled ? TRANSPORT_PRICE : 0) - (studentConfig?.personalizedDiscount || 0)).toFixed(0)} DH</p>
                <p><strong>Mois:</strong> {MONTHS.length}</p>
                <p className="discount-text"><strong>Discount annuel:</strong> -{ANNUAL_DISCOUNT * 100}%</p>
                <hr />
                <p className="annual-total">
                  <strong>Total à payer:</strong> {((getLevelPrice(selectedStudent) + (studentConfig?.transportEnabled ? TRANSPORT_PRICE : 0) - (studentConfig?.personalizedDiscount || 0)) * MONTHS.length * (1 - ANNUAL_DISCOUNT)).toFixed(0)} DH
                </p>
              </div>

              <div className="form-group">
                <label>Mode de paiement:</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="especes">💵 Espèces</option>
                  <option value="cheque">📝 Chèque</option>
                  <option value="virement">🏦 Virement</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAnnualModal(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handlePayAnnual}>
                ✅ Confirmer le paiement annuel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Receipt Modal */}
      {showReceipt && currentReceipt && (
        <PaymentReceipt
          receipt={currentReceipt}
          schoolName={schoolName || 'École'}
          logo={logo || null}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Student Details Modal using Portal - Rendered directly in body */}
      {showStudentDetailsModal && selectedStudent && studentConfig && stats && createPortal(
        <div className="modal-overlay" onClick={() => setShowStudentDetailsModal(false)}>
          <div className="modal-content student-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👨‍🎓 Détail des paiements - {selectedStudent.name}</h2>
              <button className="close-btn" onClick={() => setShowStudentDetailsModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Student Info */}
              <div className="student-details-info">
                <div className="detail-item">
                  <label>Classe:</label>
                  <span>{getStudentClassName(selectedStudent)}</span>
                </div>
                <div className="detail-item">
                  <label>Niveau:</label>
                  <span>{getStudentLevel(selectedStudent).charAt(0).toUpperCase() + getStudentLevel(selectedStudent).slice(1)}</span>
                </div>
                <div className="detail-item">
                  <label>Mensualité:</label>
                  <span>{getLevelPrice(selectedStudent)} DH</span>
                </div>
                <div className="detail-item">
                  <label>Transport:</label>
                  <span>{studentConfig.transportEnabled ? '✅ Oui (+200 DH)' : '❌ Non'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total annuel</div>
                  <div className="stat-value">{stats.total.toFixed(0)} DH</div>
                </div>
                <div className="stat-card paid">
                  <div className="stat-label">Payé</div>
                  <div className="stat-value">{stats.paid.toFixed(0)} DH</div>
                </div>
                <div className="stat-card remaining">
                  <div className="stat-label">Restant</div>
                  <div className="stat-value">{stats.remaining.toFixed(0)} DH</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Mois payés</div>
                  <div className="stat-value">{stats.monthsPaid}/{MONTHS.length}</div>
                </div>
              </div>

              {/* Payments Table */}
              <div className="payments-table-widget">
                <h3>📋 État des paiements</h3>
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((month, index) => {
                      const monthNum = index + 1
                      const payment = studentPayments.find(p => p.month === monthNum)

                      return (
                        <tr key={monthNum} className={payment?.status === 'paid' ? 'paid-row' : ''}>
                          <td className="month-name">{month}</td>
                          <td className="amount">
                            {(getLevelPrice(selectedStudent) + (studentConfig.transportEnabled ? TRANSPORT_PRICE : 0) - (studentConfig.personalizedDiscount || 0)).toFixed(0)} DH
                          </td>
                          <td className="status-cell">
                            {payment?.status === 'paid' ? (
                              <span className="status-badge paid">✅ Payé</span>
                            ) : (
                              <span className="status-badge pending">⏸️ En attente</span>
                            )}
                          </td>
                          <td className="actions-cell">
                            {payment?.status === 'paid' ? (
                              <button
                                className="btn-receipt"
                                onClick={() => {
                                  setCurrentReceipt({
                                    receiptNumber: payment.receiptNumber,
                                    studentName: selectedStudent.name,
                                    className: getStudentClassName(selectedStudent),
                                    month: MONTHS[payment.month - 1],
                                    amount: payment.paidAmount,
                                    paymentMethod: payment.paymentMethod,
                                    paymentDate: new Date(payment.paymentDate!).toLocaleDateString('fr-FR'),
                                    academicYear: payment.academicYear
                                  })
                                  setShowReceipt(true)
                                }}
                              >
                                📄 Reçu
                              </button>
                            ) : (
                              <button
                                className="btn-pay"
                                onClick={() => {
                                  setShowStudentDetailsModal(false)
                                  handleOpenPayment(monthNum)
                                }}
                              >
                                💳 Payer
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowStudentDetailsModal(false)}>
                Fermer
              </button>
              <button className="btn-annual" onClick={() => {
                setShowStudentDetailsModal(false)
                setShowAnnualModal(true)
              }}>
                💰 Paiement Annuel (-10%)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default MonthlyPayments
