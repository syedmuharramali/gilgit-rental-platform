import { ArrowUpRight, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f8faf9]">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr_.85fr_.85fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#102f26] text-white"><MapPin className="h-4 w-4" /></div>
              <div>
                <p className="font-black tracking-[-0.03em] text-slate-950">Gilgit Rental</p>
                <p className="text-xs text-slate-500">Built for better local renting</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              Verified owners, clearer rental journeys and local living insights for rooms, hostels, apartments and homes across Gilgit.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200"><ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Verified owners</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200"><Heart className="h-3.5 w-3.5 text-rose-500" /> Safer choices</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">Discover</p>
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <Link className="block hover:text-slate-950" to="/properties">Browse rentals</Link>
              <Link className="block hover:text-slate-950" to="/living-score">Living Score</Link>
              <Link className="block hover:text-slate-950" to="/about">How it works</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">Rent with us</p>
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <Link className="block hover:text-slate-950" to="/register">Create account</Link>
              <Link className="block hover:text-slate-950" to="/dashboard">Renter dashboard</Link>
              <Link className="block hover:text-slate-950" to="/owner">List a property</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">Need help?</p>
            <p className="mt-4 text-sm leading-6 text-slate-500">Use the dashboard to track applications, viewings, agreements and maintenance in one place.</p>
            <Link to="/help" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#102f26]">Help centre <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Gilgit Rental Platform. Academic final year project.</p>
          <p>Gilgit, Gilgit-Baltistan, Pakistan</p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
