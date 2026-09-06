import { Outlet } from 'react-router-dom'
import PublicFooter from '../components/navigation/PublicFooter'
import PublicNavbar from '../components/navigation/PublicNavbar'

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-950">
      <PublicNavbar />
      <Outlet />
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
