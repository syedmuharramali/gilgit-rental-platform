import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { hydrateCurrentUser } from './features/auth/authSlice'
import AdminLayout from './layouts/AdminLayout'
import DashboardLayout from './layouts/DashboardLayout'
import PublicLayout from './layouts/PublicLayout'
import {
  AdminDashboardPage,
  AdminGuard,
  AdminPropertiesPage,
  AdminReportsPage,
  AdminVerificationsPage,
} from './pages/admin/AdminPages'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import InfoPage from './pages/InfoPage'
import LivingScorePage from './pages/LivingScorePage'
import LoginPage from './pages/LoginPage'
import PropertyEditorPage from './pages/owner/PropertyEditorPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import RegisterPage from './pages/RegisterPage'
import SmartMatchesPage from './pages/SmartMatchesPage'
import {
  AgreementsPage,
  ConditionReportsPage,
  MessagesPage,
  NotificationsPage,
  OwnerPropertiesPage,
  OwnerVerificationPage,
  ProfilePage,
  ReportsPage,
  ReviewsPage,
} from './pages/workspace/AccountPages'
import {
  ApplicationsPage,
  DashboardOverviewPage,
  MaintenancePage,
  RentPage,
  TenanciesPage,
  ViewingsPage,
} from './pages/workspace/LifecyclePages'

const protectedElement = (element) => <ProtectedRoute>{element}</ProtectedRoute>

function App() {
  const dispatch = useDispatch()
  const { token, sessionChecked } = useSelector((state) => state.auth)

  useEffect(() => {
    if (token && !sessionChecked) dispatch(hydrateCurrentUser())
  }, [token, sessionChecked, dispatch])

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route path="/living-score" element={<LivingScorePage />} />
        <Route path="/about" element={<InfoPage type="about" />} />
        <Route path="/help" element={<InfoPage type="help" />} />
        <Route path="/favorites" element={protectedElement(<FavoritesPage />)} />
        <Route path="/matches" element={protectedElement(<SmartMatchesPage />)} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={protectedElement(<DashboardLayout mode="renter" />)}>
        <Route index element={<DashboardOverviewPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="viewings" element={<ViewingsPage />} />
        <Route path="tenancies" element={<TenanciesPage />} />
        <Route path="rent" element={<RentPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="agreements" element={<AgreementsPage />} />
        <Route path="condition-reports" element={<ConditionReportsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="/owner" element={protectedElement(<DashboardLayout mode="owner" />)}>
        <Route index element={<DashboardOverviewPage owner />} />
        <Route path="verification" element={<OwnerVerificationPage />} />
        <Route path="properties" element={<OwnerPropertiesPage />} />
        <Route path="properties/new" element={<PropertyEditorPage />} />
        <Route path="properties/:id/edit" element={<PropertyEditorPage />} />
        <Route path="applications" element={<ApplicationsPage owner />} />
        <Route path="viewings" element={<ViewingsPage owner />} />
        <Route path="tenancies" element={<TenanciesPage owner />} />
        <Route path="rent" element={<RentPage owner />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="agreements" element={<AgreementsPage />} />
        <Route path="condition-reports" element={<ConditionReportsPage owner />} />
        <Route path="maintenance" element={<MaintenancePage owner />} />
        <Route path="reviews" element={<ReviewsPage owner />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="/admin" element={protectedElement(<AdminGuard><AdminLayout /></AdminGuard>)}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="verifications" element={<AdminVerificationsPage />} />
        <Route path="properties" element={<AdminPropertiesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
