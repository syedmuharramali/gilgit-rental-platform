import { ArrowRight, CircleHelp, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const content = {
  'living-score': {
    eyebrow: 'Gilgit Living Score',
    title: 'Look beyond the room itself.',
    text: 'The platform surfaces practical local living details such as heating, hot water, power backup, water reliability, road access and winter accessibility so renters can compare homes with more context.',
    icon: Sparkles,
  },
  about: {
    eyebrow: 'How it works',
    title: 'One connected rental journey.',
    text: 'Discover verified listings, apply, schedule viewings, move into tenancy, manage agreements and keep important rental actions connected instead of scattered across chats and paper records.',
    icon: ShieldCheck,
  },
  help: {
    eyebrow: 'Help centre',
    title: 'Know what to do next.',
    text: 'The dashboard keeps renter and owner actions organized around the rental lifecycle. More detailed contextual help will be added as each workflow is completed.',
    icon: CircleHelp,
  },
}

function InfoPage({ type }) {
  const page = content[type]
  const Icon = page.icon

  return (
    <main className="bg-[#f6f8f7] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1100px] rounded-[36px] bg-[#102f26] p-8 text-white shadow-[0_30px_90px_rgba(16,47,38,.17)] sm:p-12 lg:p-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-emerald-100"><Icon className="h-4 w-4" /> {page.eyebrow}</span>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.055em] sm:text-6xl">{page.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">{page.text}</p>
          </div>
          <Link to="/properties" className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-[#102f26]">Browse rentals <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </main>
  )
}

export default InfoPage
