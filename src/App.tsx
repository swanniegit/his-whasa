import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useOffline } from './hooks/useOffline'

// Lazy load components for better performance
const Layout = React.lazy(() => import('./components/Layout'))
const Login = React.lazy(() => import('./pages/Login'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const PatientRegistration = React.lazy(() => import('./pages/PatientRegistration'))
const WoundAssessment = React.lazy(() => import('./pages/WoundAssessment'))
const CarePlanning = React.lazy(() => import('./pages/CarePlanning'))
const TherapyExecution = React.lazy(() => import('./pages/TherapyExecution'))
const PatientList = React.lazy(() => import('./pages/PatientList'))
const Settings = React.lazy(() => import('./pages/Settings'))
const ReferenceTables = React.lazy(() => import('./pages/Admin/ReferenceTables'))
const TestPage = React.lazy(() => import('./pages/TestPage'))
const LoadingSpinner = React.lazy(() => import('./components/LoadingSpinner'))
const OfflineIndicator = React.lazy(() => import('./components/OfflineIndicator'))

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { isOnline } = useOffline()

  return (
    <div className="app">
      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<TestPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/new" element={<PatientRegistration />} />
            <Route path="patients/:patientId/assessment" element={<WoundAssessment />} />
            <Route path="patients/:patientId/care-plan" element={<CarePlanning />} />
            <Route path="patients/:patientId/therapy" element={<TherapyExecution />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin/reference-tables" element={<ReferenceTables />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App 