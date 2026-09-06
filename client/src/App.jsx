import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { hydrateCurrentUser } from './features/auth/authSlice'
import PublicLayout from './layouts/PublicLayout'
import DashboardPage from './pages/DashboardPage'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import InfoPage from './pages/InfoPage'
import LivingScorePage from './pages/LivingScorePage'
import LoginPage from './pages/LoginPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import RegisterPage from './pages/RegisterPage'
import SmartMatchesPage from './pages/SmartMatchesPage'

function App() {
  const dispatch = useDispatch()
  const { token, sessionChecked } = useSelector((state) => state.auth)

  useEffect(() => {
    if (token && !sessionChecked) {
      dispatch(hydrateCurrentUser())
    }
  }, [token, sessionChecked, dispatch])

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <SmartMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/living-score" element={<LivingScorePage />} />
        <Route path="/about" element={<InfoPage type="about" />} />
        <Route path="/help" element={<InfoPage type="help" />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
