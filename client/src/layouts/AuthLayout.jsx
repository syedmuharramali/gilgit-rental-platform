import { motion } from 'framer-motion'
import { Home, MapPin, ShieldCheck, Sparkles } from 'lucide-react'

const floatingCards = [
  { icon: ShieldCheck, title: 'Verified owners', detail: 'Identity checked before listings go live', x: '-10%', y: '12%', delay: 0 },
  { icon: MapPin, title: 'Gilgit focused', detail: 'Rooms, hostels, apartments and homes', x: '42%', y: '48%', delay: 0.15 },
  { icon: Sparkles, title: 'Living Score', detail: 'Transparent local suitability insights', x: '-2%', y: '72%', delay: 0.3 },
]

function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <main className="auth-shell">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-grid" />

      <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="brand-cube">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-emerald-200/70">GILGIT RENTAL</p>
              <p className="text-xs text-white/45">Trusted homes. Clear journeys.</p>
            </div>
          </motion.div>

          <div className="relative mx-auto flex h-[520px] w-full max-w-[620px] items-center justify-center [perspective:1400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, rotateX: 7, rotateY: -8 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="scene-card"
            >
              <div className="scene-orbit scene-orbit-one" />
              <div className="scene-orbit scene-orbit-two" />
              <div className="scene-mountain mountain-back" />
              <div className="scene-mountain mountain-front" />
              <div className="scene-home">
                <div className="scene-home-roof" />
                <div className="scene-home-door" />
                <div className="scene-home-window left" />
                <div className="scene-home-window right" />
              </div>
              <div className="scene-badge">
                <ShieldCheck className="h-4 w-4" />
                Verified rental ecosystem
              </div>
            </motion.div>

            {floatingCards.map(({ icon: Icon, title: cardTitle, detail, x, y, delay }) => (
              <motion.div
                key={cardTitle}
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35 + delay, duration: 0.6 }}
                className="floating-info-card"
                style={{ left: x, top: y }}
              >
                <div className="floating-icon"><Icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-white">{cardTitle}</p>
                  <p className="mt-1 max-w-44 text-xs leading-5 text-white/45">{detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300/60">Built for Gilgit</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-white xl:text-5xl">
              Renting should feel simple before it feels official.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10 xl:p-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="auth-panel w-full max-w-[520px]"
          >
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="brand-cube"><Home className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold tracking-[0.16em] text-emerald-200/70">GILGIT RENTAL</p>
                  <p className="text-xs text-white/45">Trusted homes. Clear journeys.</p>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-300/70">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/50 sm:text-base">{subtitle}</p>

            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
