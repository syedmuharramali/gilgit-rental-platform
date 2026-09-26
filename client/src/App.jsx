import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { checkSession } from './features/auth/authSlice'
import AdminLayout from './layouts/AdminLayout'
import DashboardLayout from './layouts/DashboardLayout'
import PublicLayout from './layouts/PublicLayout'
import { AdminDashboardPage, AdminGuard, AdminReportsPage } from './pages/admin/AdminPages'
import {
  AdminPropertiesQueuePage,
  AdminPropertyReviewPage,
  AdminVerificationReviewPage,
  AdminVerificationsQueuePage,
} from './pages/admin/AdminReviewPages'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import InfoPage from './pages/InfoPage'
import LivingScorePage from './pages/LivingScorePage'
import LoginPage from './pages/LoginPage'
import PropertyEditorPage from './pages/owner/PropertyEditorPage'
import PropertyMediaPage from './pages/owner/PropertyMediaPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import RegisterPage from './pages/RegisterPage'
import SmartMatchesPage from './pages/SmartMatchesPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import {
  OwnerPropertiesPage,
  ProfilePage,
  ReportsPage,
  ReviewsPage,
} from './pages/workspace/AccountPages'
import ApplicationsPage from './pages/workspace/ApplicationsPage'
import { HotelBookingsPage, TripsPage } from './pages/workspace/BookingPages'
import DashboardOverviewPage from './pages/workspace/DashboardOverviewPage'
import MessagesPage from './pages/workspace/MessagesPage'
import NotificationsPage from './pages/workspace/NotificationsPage'
import RentalAgreementsPage from './pages/workspace/RentalAgreementsPage'
import OwnerVerificationPage from './pages/workspace/OwnerVerificationPage'
import {
  ViewingsPage,
} from './pages/workspace/LifecyclePages'

const protectedElement = (element) => <ProtectedRoute>{element}</ProtectedRoute>

function App() {
  const dispatch = useDispatch()
  const session = useSelector((state) => state.auth.session)
  const retries = useRef(0)

  // The session cookie is invisible to the page, so ask the server once on
  // load who is signed in.
  useEffect(() => {
    dispatch(checkSession())
  }, [dispatch])

  // If the server couldn't be reached (still starting, restarting after a
  // code change, network blip), keep trying: 2 s, 4 s, 8 s … up to 30 s
  // apart, and at once when the tab regains focus or the network returns.
  const serverUnreachable = Boolean(session.error) && !session.checking

  useEffect(() => {
    if (session.checked) {
      retries.current = 0
      return undefined
    }
    if (!serverUnreachable) return undefined

    const retry = () => dispatch(checkSession())
    const timer = setTimeout(retry, Math.min(2000 * 2 ** retries.current, 30000))
    retries.current += 1
    window.addEventListener('focus', retry)
    window.addEventListener('online', retry)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', retry)
      window.removeEventListener('online', retry)
    }
  }, [serverUnreachable, session.checked, dispatch])

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route path="/living-score" element={<LivingScorePage />} />
        <Route path="/about" element={<InfoPage type="about" />} />
        <Route path="/help" element={<InfoPage type="help" />} />
        <Route path="/favorites" element={protectedElement(<Navigate to="/dashboard/favorites" replace />)} />
        <Route path="/matches" element={protectedElement(<Navigate to="/dashboard/matches" replace />)} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="/dashboard" element={protectedElement(<DashboardLayout mode="renter" />)}>
        <Route index element={<DashboardOverviewPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="matches" element={<SmartMatchesPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="viewings" element={<ViewingsPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="agreements" element={<RentalAgreementsPage />} />
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
        <Route path="media" element={<PropertyMediaPage />} />
        <Route path="applications" element={<ApplicationsPage owner />} />
        <Route path="viewings" element={<ViewingsPage owner />} />
        <Route path="bookings" element={<HotelBookingsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="agreements" element={<RentalAgreementsPage />} />
        <Route path="reviews" element={<ReviewsPage owner />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="/admin" element={protectedElement(<AdminGuard><AdminLayout /></AdminGuard>)}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="verifications" element={<AdminVerificationsQueuePage />} />
        <Route path="verifications/:id" element={<AdminVerificationReviewPage />} />
        <Route path="properties" element={<AdminPropertiesQueuePage />} />
        <Route path="properties/:id" element={<AdminPropertyReviewPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
