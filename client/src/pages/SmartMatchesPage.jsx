import { AlertTriangle, RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react'
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
  const {
    data: matchesData,
    isLoading: matchesLoading,
    isFetching,
    error: matchesError,
    refetch,
  } = useGetMatchesQuery(20)
  const [savePreferences, { isLoading: isSaving }] = useSavePreferencesMutation()

  const onSave = async (values) => {
    try {
      await savePreferences(values).unwrap()
      toast.success('Preferences saved and matches refreshed')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to save preferences')
    }
  }

  const matchCount = matchesData?.count ?? matchesData?.matches?.length ?? 0

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] px-5 py-10 text-white sm:px-8 lg:px-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_5%,rgba(56,189,248,.13),transparent_25%),radial-gradient(circle_at_86%_25%,rgba(139,92,246,.11),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[36px] border border-white/10 bg-[#0b111f]/90 p-7 shadow-[0_32px_100px_rgba(0,0,0,.34)] backdrop-blur-2xl sm:p-10 lg:p-12"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200">
                <Sparkles className="h-4 w-4" /> Smart Matching
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Homes ranked around what <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">matters to you.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/48">
                Set your budget, location, furnishing, amenities and winter priorities. Published rentals are scored transparently against those preferences.
              </p>
            </div>
            <div className="min-w-[190px] rounded-[26px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-white/35">Current results</p>
              <p className="mt-2 text-4xl font-black">{matchesError ? '—' : matchCount}</p>
              <p className="mt-1 text-sm text-white/42">ranked properties</p>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[420px_1fr]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[30px] border border-white/9 bg-[#0b111f]/92 p-6 shadow-[0_22px_70px_rgba(0,0,0,.26)] backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/8 pb-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black">Your preferences</h2>
                  <p className="text-xs text-white/35">Tune the ranking whenever your needs change.</p>
                </div>
              </div>
              <div className="mt-6">
                {preferencesLoading ? (
                  <div className="h-96 animate-pulse rounded-3xl bg-white/[0.04]" />
                ) : (
                  <PreferenceForm
                    preferences={preferences}
                    amenities={amenitiesData?.amenities || []}
                    onSave={onSave}
                    isSaving={isSaving}
                  />
                )}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-300">Best fit first</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">Your ranked matches</h2>
              </div>
              {isFetching && !matchesLoading ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-white/35">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Refreshing
                </span>
              ) : null}
            </div>

            {matchesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-[30px] border border-white/8 bg-white/[0.035]" />)}
              </div>
            ) : null}

            {!matchesLoading && matchesError ? (
              <div className="rounded-[30px] border border-amber-300/15 bg-amber-300/[0.06] p-8 text-center">
                <AlertTriangle className="mx-auto h-7 w-7 text-amber-200" />
                <p className="mt-4 text-lg font-black">We could not load your matches</p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/42">
                  If you have not saved preferences yet, complete the panel first. Otherwise retry the live matching request.
                </p>
                <button type="button" onClick={refetch} className="mt-5 rounded-full bg-white px-5 py-2.5 text-xs font-black text-[#07101e]">Try again</button>
              </div>
            ) : null}

            {!matchesLoading && !matchesError && (matchesData?.matches?.length || 0) === 0 ? (
              <div className="rounded-[30px] border border-dashed border-white/12 bg-white/[0.025] p-10 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-white/20" />
                <p className="mt-4 text-lg font-black">No public rentals to rank yet</p>
                <p className="mt-2 text-sm text-white/38">Your preferences are saved. New published listings will appear here automatically.</p>
              </div>
            ) : null}

            <div className="space-y-4">
              {(matchesData?.matches || []).map((match, index) => (
                <MatchCard key={match.property._id} match={match} index={index} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SmartMatchesPage
