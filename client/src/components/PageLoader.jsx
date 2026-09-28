import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Shown for the moment it takes to download a page the first time it opens.
function PageLoader({ fullScreen = false }) {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      className={`grid place-items-center text-white/60 ${fullScreen ? 'min-h-screen bg-[#070b14]' : 'min-h-[60vh]'}`}
    >
      <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}

export default PageLoader
