import { Heart, RefreshCw, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import { useGetFavoritesQuery } from '../features/favorites/favoritesApi'

function FavoritesPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useGetFavoritesQuery()
  const favorites = data?.favorites || []

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="h-12 w-64 animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[4/4.3] animate-pulse rounded-[30px] border border-white/8 bg-white/[0.035]" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="relative grid min-h-[70vh] place-items-center overflow-hidden bg-[#070b14] px-5 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(244,63,94,.08),transparent_28%)]" />
        <div className="relative max-w-md rounded-[30px] border border-white/10 bg-white/[0.035] p-8 backdrop-blur-xl">
          <p className="text-2xl font-black">{t('favorites.errorTitle')}</p>
          <p className="mt-2 text-sm leading-6 text-white/42">{t('favorites.errorText')}</p>
          <button type="button" onClick={refetch} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#07101e]">
            <RefreshCw className="h-4 w-4" /> {t('common.tryAgain')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] px-5 py-10 text-white sm:px-8 lg:px-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,.12),transparent_26%),radial-gradient(circle_at_88%_20%,rgba(139,92,246,.1),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-cyan-200">
              <Heart className="h-3.5 w-3.5 fill-current" /> {t('favorites.badge')}
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{t('favorites.title')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/42 sm:text-base">{t('favorites.text')}</p>
          </div>

          {favorites.length > 0 && <p className="text-sm font-bold text-white/32">{t('favorites.count', { count: favorites.length })}</p>}
        </motion.div>

        {favorites.length === 0 ? (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 grid min-h-[420px] place-items-center rounded-[34px] border border-dashed border-white/12 bg-white/[0.025] px-6 text-center shadow-[0_24px_80px_rgba(0,0,0,.22)]">
            <div className="max-w-md">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200"><Heart className="h-6 w-6" /></div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">{t('favorites.emptyTitle')}</h2>
              <p className="mt-3 text-sm leading-7 text-white/38">{t('favorites.emptyText')}</p>
              <Link to="/properties" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e] shadow-lg transition hover:-translate-y-0.5">
                <Search className="h-4 w-4" /> {t('common.browseRentals')}
              </Link>
            </div>
          </motion.section>
        ) : (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.filter((favorite) => favorite.property).map((favorite) => (
              <PropertyCard key={favorite._id} property={favorite.property} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default FavoritesPage
