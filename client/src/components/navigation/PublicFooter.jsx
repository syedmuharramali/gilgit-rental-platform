import { ArrowUpRight, Heart, Instagram, Linkedin, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

function PublicFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#050812] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_.75fr_.75fr_.9fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-[#07101e]"><Sparkles className="h-5 w-5" /></div>
              <div><p className="font-black tracking-[-0.03em]">Gilgit Rental</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/30">Stay smarter</p></div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/40">A local-first rental platform for discovering verified homes, comparing practical living conditions and managing the full rental journey in one place.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.1em] text-white/50"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> Verified owners</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2"><Heart className="h-3.5 w-3.5 text-violet-300" /> Connected journey</span></div>
          </div>

          <div><p className="text-sm font-black">Discover</p><div className="mt-4 space-y-3 text-sm text-white/40"><Link className="block hover:text-white" to="/properties">Browse rentals</Link><Link className="block hover:text-white" to="/living-score">Living Score</Link><Link className="block hover:text-white" to="/matches">Smart matches</Link><Link className="block hover:text-white" to="/about">How it works</Link></div></div>
          <div><p className="text-sm font-black">Your account</p><div className="mt-4 space-y-3 text-sm text-white/40"><Link className="block hover:text-white" to="/register">Create account</Link><Link className="block hover:text-white" to="/dashboard">Renter dashboard</Link><Link className="block hover:text-white" to="/owner">Owner workspace</Link><Link className="block hover:text-white" to="/favorites">Saved homes</Link></div></div>

          <div><p className="text-sm font-black">Need help?</p><p className="mt-4 text-sm leading-6 text-white/40">Track applications, viewings, agreements, rent records and maintenance from one workspace.</p><Link to="/help" className="mt-4 inline-flex items-center gap-1 text-sm font-black text-cyan-200">Help centre <ArrowUpRight className="h-3.5 w-3.5" /></Link><div className="mt-6 flex gap-2"><span className="grid h-9 w-9 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-white/45"><Instagram className="h-4 w-4" /></span><span className="grid h-9 w-9 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-white/45"><Linkedin className="h-4 w-4" /></span></div></div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Gilgit Rental Platform.</p><p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Gilgit, Gilgit-Baltistan, Pakistan</p></div>
      </div>
    </footer>
  )
}

export default PublicFooter
