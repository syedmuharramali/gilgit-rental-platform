import { Heart, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import { useGetFavoritesQuery } from '../features/favorites/favoritesApi'

function FavoritesPage() {
  const { data, isLoading, error } = useGetFavoritesQuery()
  const favorites = data?.favorites || []

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f6f8f7] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="h-12 w-64 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[4/3] animate-pulse rounded-[28px] bg-slate-200" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f6f8f7] px-5 text-center">
        <div>
          <p className="text-2xl font-black text-slate-950">Unable to load saved homes</p>
          <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f2ed] px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#245545]">
              <Heart className="h-3.5 w-3.5 fill-current" /> Saved homes
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">Your shortlist.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Keep the rentals you are seriously considering in one place and compare them before applying.
            </p>
          </div>

          {favorites.length > 0 && (
            <p className="text-sm font-bold text-slate-400">{favorites.length} saved {favorites.length === 1 ? 'home' : 'homes'}</p>
          )}
        </motion.div>

        {favorites.length === 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 grid min-h-[420px] place-items-center rounded-[34px] border border-slate-200 bg-white px-6 text-center shadow-[0_20px_60px_rgba(15,23,42,.06)]"
          >
            <div className="max-w-md">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#edf5f1] text-[#245545]">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">No saved homes yet</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">Tap the heart on any listing and it will appear here.</p>
              <Link to="/properties" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#102f26] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5">
                <Search className="h-4 w-4" /> Browse rentals
              </Link>
            </div>
          </motion.section>
        ) : (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => (
              <PropertyCard key={favorite._id} property={favorite.property} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default FavoritesPage
