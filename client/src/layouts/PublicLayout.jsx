import { Helmet } from 'react-helmet-async'
import { Outlet, useLocation } from 'react-router-dom'
import PublicFooter from '../components/navigation/PublicFooter'
import PublicNavbar from '../components/navigation/PublicNavbar'

const metadata = {
  '/': ['Gilgit Rental Platform', 'Discover verified rentals in Gilgit with transparent Living Scores, smart matching and a connected rental journey.'],
  '/properties': ['Find Rentals in Gilgit | Gilgit Rental', 'Browse published rental properties in Gilgit by area, rent, amenities and winter-readiness details.'],
  '/living-score': ['Gilgit Living Score | Gilgit Rental', 'Understand heating, hot water, power backup, water reliability, road access and winter accessibility before renting.'],
  '/about': ['How Gilgit Rental Works', 'Learn how verified owners, property review and connected rental workflows make renting in Gilgit clearer.'],
  '/help': ['Help Centre | Gilgit Rental', 'Get guidance for renters and owners using the Gilgit Rental Platform.'],
}

function PublicLayout() {
  const location = useLocation()
  const isProperty = location.pathname.startsWith('/properties/')
  const [title, description] = isProperty
    ? ['Property Details | Gilgit Rental', 'Review rental details, amenities, location, Living Score, reviews and owner information.']
    : metadata[location.pathname] || ['Gilgit Rental Platform', 'A verified rental marketplace built for Gilgit.']

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-950">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#102f26" />
      </Helmet>
      <PublicNavbar />
      <Outlet />
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
