import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { GraduationCap } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [targetExam, setTargetExam] = useState<'JEE' | 'NEET' | 'BOTH'>('JEE')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName, targetExam)
    setBusy(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-ink text-paper flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} strokeWidth={1.75} />
          <span className="font-serif text-lg tracking-tight">Studania</span>
        </div>
        <div>
          <p className="font-serif text-3xl leading-snug mb-4">
            Notes, lectures, doubts and revision —<br />in one place, not six tabs.
          </p>
          <p className="text-sm text-paper/60 max-w-sm">
            Built for JEE and NEET aspirants who are tired of hunting through
            Telegram channels and WhatsApp groups for the one PDF they need.
          </p>
        </div>
        <p className="text-xs text-paper/40">Stardance × Frictionless</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <GraduationCap size={20} strokeWidth={1.75} className="text-ink" />
            <span className="font-serif text-lg text-ink">Studania</span>
          </div>

          <h1 className="font-serif text-2xl text-ink mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate mb-6">
            {mode === 'signin' ? 'Pick up right where you left off.' : 'Takes less than a minute.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-ink-soft mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-focus/30 focus:border-focus"
                  placeholder="Aditi Sharma"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-ink-soft mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-focus/30 focus:border-focus"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-soft mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-focus/30 focus:border-focus"
                placeholder="At least 6 characters"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-ink-soft mb-1.5">Target exam</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JEE', 'NEET', 'BOTH'] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setTargetExam(opt)}
                      className={`py-2 rounded-lg text-sm border transition-colors ${
                        targetExam === opt
                          ? 'border-focus bg-focus-soft text-focus font-medium'
                          : 'border-line text-slate hover:border-ink/30'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate mt-6 text-center">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
              className="text-focus font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
