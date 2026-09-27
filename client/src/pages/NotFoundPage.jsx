import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

// Unknown addresses (a mistyped or old link) instead of silently going home.
export default function NotFoundPage({ home = '/' }) {
  const { t } = useTranslation()

  return (
    <main className="grid min-h-[60vh] place-items-center px-5 py-16 text-center text-white">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] text-cyan-200"><Compass className="h-6 w-6" /></span>
        <p className="mt-5 text-2xl font-black">{t('notFound.title')}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">{t('notFound.text')}</p>
        <Link to={home} className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e]">{t('notFound.back')}</Link>
      </div>
    </main>
  )
}
