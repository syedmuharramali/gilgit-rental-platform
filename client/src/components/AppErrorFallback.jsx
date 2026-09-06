import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function AppErrorFallback({ error, resetErrorBoundary }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f7] px-5">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,.09)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle className="h-6 w-6" /></div>
        <h1 className="mt-5 text-2xl font-black tracking-[-.04em] text-slate-950">This screen ran into a problem.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your account data is still safe. Reload this part of the interface and try the action again.</p>
        {import.meta.env.DEV && error?.message && <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs text-slate-300">{error.message}</pre>}
        <button onClick={resetErrorBoundary} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#102f26] px-5 text-sm font-black text-white"><RotateCcw className="h-4 w-4" /> Try again</button>
      </div>
    </main>
  )
}
