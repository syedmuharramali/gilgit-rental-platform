import { ArrowRight, CircleHelp, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
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
    text: 'Discover verified listings, apply, schedule viewings, agree on terms and complete a rental agreement without scattering important details across chats and paper records.',
    icon: ShieldCheck,
  },
  help: {
    eyebrow: 'Help centre',
    title: 'Know what to do next.',
    text: 'The dashboard keeps renter and owner actions organized around simple next steps, from finding a home through completing an agreement.',
    icon: CircleHelp,
  },
}

function InfoPage({ type }) {
  const page = content[type] || content.about
  const Icon = page.icon

  return (
    <main className="relative min-h-[70vh] overflow-hidden bg-[#070b14] px-5 py-14 text-white sm:px-8 lg:px-10 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,.13),transparent_28%),radial-gradient(circle_at_84%_74%,rgba(139,92,246,.11),transparent_30%)]" />
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[38px] border border-white/10 bg-[#0b111f]/92 p-8 shadow-[0_34px_110px_rgba(0,0,0,.34)] backdrop-blur-2xl sm:p-12 lg:p-16">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,.035),transparent_45%,rgba(139,92,246,.05))]" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-2 text-xs font-black text-cyan-200"><Icon className="h-4 w-4" /> {page.eyebrow}</span>
            <h1 className="mt-6 text-4xl font-black leading-[.98] tracking-[-0.055em] sm:text-6xl">{page.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/46">{page.text}</p>
          </div>
          <Link to="/properties" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e] shadow-[0_16px_40px_rgba(56,189,248,.14)] transition hover:-translate-y-0.5">Browse rentals <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </motion.section>
    </main>
  )
}

export default InfoPage
