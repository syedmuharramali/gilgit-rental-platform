import { Bell, Compass, Heart, Menu, Search, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, NavLink, useLocation } from 'react-router-dom'
import LanguageSwitcher from '../LanguageSwitcher'

const links = [
  { to: '/properties', key: 'nav.explore' },
  { to: '/properties?category=shops', key: 'nav.shops', category: 'shops' },
  { to: '/properties?category=stays', key: 'nav.stays', category: 'stays' },
  { to: '/living-score', key: 'nav.livingScore' },
  { to: '/about', key: 'nav.howItWorks' },
]

function navClass(isActive) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-white/64 hover:bg-white/[0.07] hover:text-white'}`
}

function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const token = useSelector((state) => state.auth.token)
  const { t } = useTranslation()
  const location = useLocation()
  // Explore, Shops and Stays share /properties; tell them apart by ?category
  // (or by a type in the URL, as the home page cards link that way).
  const query = new URLSearchParams(location.search)
  const urlType = query.get('propertyType')
  const currentCategory = urlType
    ? urlType === 'shop' ? 'shops' : ['hotel', 'guest_house'].includes(urlType) ? 'stays' : 'homes'
    : query.get('category') || 'homes'
  const linkActive = (link, isActive) => isActive && (link.to.startsWith('/properties') ? (link.category || 'homes') === currentCategory : true)

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#060914]/88 text-white backdrop-blur-2xl">
      <div className="mx-auto flex h-[74px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link to="/" className="group flex items-center gap-3">
          <motion.div whileHover={{ rotate: -8, scale: 1.05 }} className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-[#07101e] shadow-[0_12px_35px_rgba(56,189,248,.22)]">
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div className="leading-tight">
            <p className="text-[15px] font-black tracking-[-0.03em]">{t('common.brand')}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">{t('common.brandTagline')}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => navClass(linkActive(link, isActive))}>{t(link.key)}</NavLink>)}
          {token && <NavLink to="/matches" className={({ isActive }) => navClass(isActive)}>{t('nav.smartMatches')}</NavLink>}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher compact className="mr-1" />
          <Link to="/properties" aria-label={t('nav.searchRentals')} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"><Search className="h-4 w-4" /></Link>
          {token && <><Link to="/favorites" aria-label={t('nav.savedHomes')} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"><Heart className="h-4 w-4" /></Link><Link to="/dashboard/notifications" aria-label={t('nav.notifications')} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"><Bell className="h-4 w-4" /></Link></>}
          {token ? <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#07101e] shadow-[0_14px_30px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5"><Compass className="h-4 w-4" /> {t('common.dashboard')}</Link> : <><Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/68 transition hover:text-white">{t('common.signIn')}</Link><Link to="/register" className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-2.5 text-sm font-black text-[#07101e] shadow-[0_14px_34px_rgba(56,189,248,.18)] transition hover:-translate-y-0.5">{t('common.createAccount')}</Link></>}
        </div>

        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={t('nav.toggle')}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-white/8 bg-[#080c18] lg:hidden">
            <div className="space-y-2 px-5 py-5 sm:px-8">
              {links.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white">{t(link.key)}</Link>)}
              {token && <><Link to="/matches" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white">{t('nav.smartMatches')}</Link><Link to="/favorites" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white">{t('nav.savedHomes')}</Link></>}
              <div className="pt-2"><LanguageSwitcher className="w-full justify-center" /></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to={token ? '/dashboard' : '/login'} onClick={() => setOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white">{token ? t('common.dashboard') : t('common.signIn')}</Link>
                {!token && <Link to="/register" onClick={() => setOpen(false)} className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-3 text-center text-sm font-black text-[#07101e]">{t('nav.joinFree')}</Link>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default PublicNavbar
