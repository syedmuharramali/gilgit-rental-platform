import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import PublicFooter from '../components/navigation/PublicFooter'
import PublicNavbar from '../components/navigation/PublicNavbar'

const metadataKeys = {
  '/': ['meta.homeTitle', 'meta.homeDesc'],
  '/properties': ['meta.propertiesTitle', 'meta.propertiesDesc'],
  '/living-score': ['meta.livingTitle', 'meta.livingDesc'],
  '/about': ['meta.aboutTitle', 'meta.aboutDesc'],
  '/help': ['meta.helpTitle', 'meta.helpDesc'],
}

function PublicLayout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isProperty = location.pathname.startsWith('/properties/')
  const [titleKey, descriptionKey] = isProperty
    ? ['meta.detailsTitle', 'meta.detailsDesc']
    : metadataKeys[location.pathname] || ['meta.homeTitle', 'meta.fallbackDesc']
  const title = t(titleKey)
  const description = t(descriptionKey)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <Helmet htmlAttributes={{ lang: i18n.resolvedLanguage || i18n.language }}>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#070b14" />
      </Helmet>
      <PublicNavbar />
      <Outlet />
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
