import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OfflineProvider } from './contexts/OfflineContext'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorFallback from './components/ErrorFallback'
import { ErrorBoundary } from 'react-error-boundary'

// Import existing pages
import Login from './pages/Login'
import Register from './pages/Register'
import TestPage from './pages/TestPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PatientList from './pages/PatientList'
import PatientRegistration from './pages/PatientRegistration'
import WoundAssessment from './pages/WoundAssessment'
import CarePlanning from './pages/CarePlanning'
import TherapyExecution from './pages/TherapyExecution'
import Settings from './pages/Settings'
import ReferenceTables from './pages/Admin/ReferenceTables'
import UserManagement from './pages/Admin/UserManagement'

// Import new booking system page
const BookingSystem = React.lazy(() => import('./pages/BookingSystem'))

// Import enhanced ProtectedRoute
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'))

// Import basic protected route (renamed from original)
const BasicProtectedRoute = React.lazy(() => import('./components/BasicProtectedRoute'))

// Import CSS
import './styles/index.css'

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <OfflineProvider>
          <div className="app">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/test" element={<TestPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <BasicProtectedRoute>
                      <Layout />
                    </BasicProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Patient Management - Available to all authenticated users */}
                  <Route path="patients" element={<PatientList />} />
                  <Route path="patients/new" element={<PatientRegistration />} />
                  
                  {/* Booking System - Available to all authenticated users */}
                  <Route path="booking" element={<BookingSystem />} />
                  
                  {/* Clinical Features - Only for Wound Specialists and Admins */}
                  <Route 
                    path="patients/:patientId/assessment" 
                    element={
                      <ProtectedRoute requiredRole="wound_specialist_nurse" fallbackPath="/dashboard">
                        <WoundAssessment />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="patients/:patientId/care-plan" 
                    element={
                      <ProtectedRoute requiredRole="wound_specialist_nurse" fallbackPath="/dashboard">
                        <CarePlanning />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="patients/:patientId/therapy" 
                    element={
                      <ProtectedRoute requiredRole="wound_specialist_nurse" fallbackPath="/dashboard">
                        <TherapyExecution />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Settings - Available to all authenticated users */}
                  <Route path="settings" element={<Settings />} />
                  
                  {/* Administration - Only for Admins */}
                  <Route 
                    path="admin/reference-tables" 
                    element={
                      <ProtectedRoute requiredRole="administrator" fallbackPath="/dashboard">
                        <ReferenceTables />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin/user-management" 
                    element={
                      <ProtectedRoute requiredRole="administrator" fallbackPath="/dashboard">
                        <UserManagement />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </OfflineProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App 