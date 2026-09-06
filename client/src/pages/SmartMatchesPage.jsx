import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import MatchCard from '../components/scoring/MatchCard'
import PreferenceForm from '../components/scoring/PreferenceForm'
import { useGetAmenitiesQuery } from '../features/amenities/amenitiesApi'
import {
  useGetMatchesQuery,
  useGetPreferencesQuery,
  useSavePreferencesMutation,
} from '../features/scoring/scoringApi'

function SmartMatchesPage() {
  const { data: preferences, isLoading: preferencesLoading } = useGetPreferencesQuery()
  const { data: amenitiesData } = useGetAmenitiesQuery()
  const { data: matchesData, isLoading: matchesLoading, isFetching, error: matchesError, refetch } = useGetMatchesQuery(20)
  const [savePreferences, { isLoading: isSaving }] = useSavePreferencesMutation()

  const onSave = async (values) => {
    try {
      await savePreferences(values).unwrap()
      toast.success('Preferences saved')
      await refetch()
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to save preferences')
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-[1440px]">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[36px] bg-[#102f26] p-7 text-white shadow-[0_28px_80px_rgba(16,47,38,.16)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black text-emerald-100"><Sparkles className="h-4 w-4" /> Smart Matching</span>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-6xl">Homes ranked around what matters to you.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">Set your budget, location, furnishing, amenities and winter priorities. We then score published rentals transparently against those preferences.</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-white/45">Current results</p>
              <p className="mt-2 text-4xl font-black">{matchesData?.count ?? 0}</p>
              <p className="mt-1 text-sm text-white/50">ranked properties</p>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[420px_1fr]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.06)]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf5f0] text-[#245545]"><SlidersHorizontal className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-black text-slate-950">Your preferences</h2><p className="text-xs text-slate-400">Change them anytime.</p></div>
              </div>
              <div className="mt-6">
                {preferencesLoading ? <div className="h-96 animate-pulse rounded-3xl bg-slate-100" /> : <PreferenceForm preferences={preferences} amenities={amenitiesData?.amenities || []} onSave={onSave} isSaving={isSaving} />}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Best fit first</p><h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">Your ranked matches</h2></div>
              {isFetching && !matchesLoading ? <span className="text-xs font-bold text-slate-400">Refreshing…</span> : null}
            </div>

            {matchesLoading ? <div className="space-y-4">{[1,2,3].map((item) => <div key={item} className="h-72 animate-pulse rounded-[30px] bg-slate-200" />)}</div> : null}

            {!matchesLoading && matchesError ? (
              <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-8 text-center">
                <p className="text-lg font-black text-amber-950">Set your preferences first</p>
                <p className="mt-2 text-sm leading-6 text-amber-800/70">Use the panel on the left, save your choices, and we’ll rank rentals for you.</p>
              </div>
            ) : null}

            {!matchesLoading && !matchesError && (matchesData?.matches?.length || 0) === 0 ? (
              <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center"><p className="text-lg font-black text-slate-950">No public rentals to rank yet</p><p className="mt-2 text-sm text-slate-500">Your preferences are saved. New listings will appear here when available.</p></div>
            ) : null}

            <div className="space-y-4">
              {(matchesData?.matches || []).map((match, index) => <MatchCard key={match.property._id} match={match} index={index} />)}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SmartMatchesPage
