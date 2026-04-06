import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import { SchoolDataProvider } from './store/SchoolDataContext'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/ToastContainer'
import ErrorReporter from './components/ErrorReporter'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Unauthorized from './components/Unauthorized'
import Dashboard from './components/Dashboard'
import Teachers from './components/Teachers'
import Classes from './components/Classes'
import Subjects from './components/Subjects'
import Salles from './components/Salles'
import Timetable from './components/Timetable'
import Replacements from './components/Replacements'
import Students from './components/Students'
import Grades from './components/Grades'
import Attendance from './components/Attendance'
import MassarGradesAnalytics from './components/MassarGradesAnalytics'
import SettingsExtended from './components/SettingsExtended'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import ReportCards from './components/ReportCards'
import Homework from './components/Homework'
import QRCodeGenerator from './components/QRCodeGenerator'
import QRCodeScanner from './components/QRCodeScanner'
import Payments from './components/Payments'
import Library from './components/Library'
import VideoConference from './components/VideoConference'
import MonthlyPayments from './components/MonthlyPayments'
import Stock from './components/Stock'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import UserManagement from './components/admin/UserManagement'
import SchoolsAdmin from './components/admin/SchoolsAdmin'
import UserManager from './components/admin/UserManager'
import './components/Dashboard.css'

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <SchoolDataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="teachers" element={<ProtectedRoute requiredPermission="canAccessTeachers"><Teachers /></ProtectedRoute>} />
                <Route path="classes" element={<ProtectedRoute requiredPermission="canAccessClasses"><Classes /></ProtectedRoute>} />
                <Route path="subjects" element={<ProtectedRoute requiredPermission="canAccessClasses"><Subjects /></ProtectedRoute>} />
                <Route path="salles" element={<ProtectedRoute requiredPermission="canAccessClasses"><Salles /></ProtectedRoute>} />
                <Route path="timetable" element={<ProtectedRoute requiredPermission="canAccessTimetable"><Timetable /></ProtectedRoute>} />
                <Route path="replacements" element={<ProtectedRoute requiredPermission="canAccessReplacements"><Replacements /></ProtectedRoute>} />
                <Route path="students" element={<ProtectedRoute requiredPermission="canAccessStudents"><Students /></ProtectedRoute>} />
                <Route path="grades" element={<ProtectedRoute requiredPermission="canAccessGrades"><Grades /></ProtectedRoute>} />
                <Route path="report-cards" element={<ProtectedRoute requiredPermission="canAccessReportCards"><ReportCards /></ProtectedRoute>} />
                <Route path="homework" element={<ProtectedRoute requiredPermission="canAccessHomework"><Homework /></ProtectedRoute>} />
                <Route path="qr-generate" element={<ProtectedRoute requiredPermission="canAccessQRCode"><QRCodeGenerator /></ProtectedRoute>} />
                <Route path="attendance/scan" element={<ProtectedRoute requiredPermission="canScanQRCode"><QRCodeScanner /></ProtectedRoute>} />
                <Route path="payments" element={<ProtectedRoute requiredPermission="canAccessPayments"><Payments /></ProtectedRoute>} />
                <Route path="library" element={<ProtectedRoute requiredPermission="canAccessLibrary"><Library /></ProtectedRoute>} />
                <Route path="video" element={<ProtectedRoute requiredPermission="canAccessTimetable"><VideoConference /></ProtectedRoute>} />
                <Route path="monthly-payments" element={<ProtectedRoute requiredPermission="canAccessMonthlyPayments"><MonthlyPayments /></ProtectedRoute>} />
                <Route path="attendance" element={<ProtectedRoute requiredPermission="canAccessStudents"><Attendance /></ProtectedRoute>} />
                <Route path="massar-analytics" element={<ProtectedRoute requiredPermission="canViewStatistics"><MassarGradesAnalytics /></ProtectedRoute>} />
                <Route path="analytics" element={<ProtectedRoute requiredPermission="canAccessAnalytics"><AnalyticsDashboard /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute requiredPermission="canAccessSettings"><SettingsExtended /></ProtectedRoute>} />
                <Route path="stock" element={<ProtectedRoute requiredPermission="canAccessStock"><Stock /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['admin', 'director']}><UserManagement /></ProtectedRoute>} />
                <Route path="user-manager" element={<ProtectedRoute allowedRoles={['admin', 'director']}><UserManager /></ProtectedRoute>} />
                <Route path="schools" element={<ProtectedRoute allowedRoles={['admin', 'director']}><SchoolsAdmin /></ProtectedRoute>} />
              </Route>
            </Routes>
            <ToastContainer />
            <ErrorReporter />
          </SchoolDataProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
