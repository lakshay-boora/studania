import { type ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, LayoutGrid, MessagesSquare, LogOut, Flame } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Subject } from '../types'

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadSubjects() {
      if (!profile?.target_exam) return
      const examSlug = profile.target_exam === 'BOTH' ? null : profile.target_exam.toLowerCase()
      let query = supabase.from('subject_exams').select('subjects(id,name,slug,color), exams!inner(slug)')
      if (examSlug) query = query.eq('exams.slug', examSlug)
      const { data } = await query
      if (data) {
        const unique = new Map<string, Subject>()
        for (const row of data as unknown as { subjects: Subject }[]) {
          if (row.subjects) unique.set(row.subjects.id, row.subjects)
        }
        setSubjects(Array.from(unique.values()))
      }
    }
    loadSubjects()
  }, [profile])

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-line flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 flex items-center gap-2">
          <GraduationCap size={20} strokeWidth={1.75} className="text-ink" />
          <span className="font-serif text-lg text-ink">Studania</span>
        </div>

        <nav className="px-3 space-y-0.5">
          <NavItem to="/" icon={<LayoutGrid size={16} />} label="Dashboard" active={location.pathname === '/'} />
          <NavItem to="/doubts" icon={<MessagesSquare size={16} />} label="Doubt Hub" active={location.pathname.startsWith('/doubts')} />
        </nav>

        <div className="px-5 pt-5 pb-2">
          <p className="text-xs uppercase tracking-wide text-slate/70 font-medium">Subjects</p>
        </div>
        <div className="flex-1 overflow-y-auto rail-scroll px-3 space-y-0.5">
          {subjects.map((s) => (
            <Link
              key={s.id}
              to={`/subjects/${s.slug}`}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                location.pathname.includes(`/subjects/${s.slug}`)
                  ? 'bg-focus-soft text-focus font-medium'
                  : 'text-ink-soft hover:bg-paper-dim'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              {s.name}
            </Link>
          ))}
        </div>

        <div className="p-3 border-t border-line">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="min-w-0">
              <p className="text-sm text-ink font-medium truncate">{profile?.full_name || 'Student'}</p>
              <p className="text-xs text-slate">{profile?.target_exam}</p>
            </div>
            <button onClick={handleSignOut} className="text-slate hover:text-ink p-1.5 rounded-md hover:bg-paper-dim shrink-0" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

function NavItem({ to, icon, label, active }: { to: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-ink text-paper font-medium' : 'text-ink-soft hover:bg-paper-dim'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-soft text-amber-700 text-sm font-medium">
      <Flame size={14} className="text-amber" />
      {days} day{days === 1 ? '' : 's'} streak
    </div>
  )
}
