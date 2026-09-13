import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import Layout, { StreakBadge } from '../components/Layout'
import type { Chapter, Progress, Subject } from '../types'
import { ArrowRight, CircleDot, Clock3 } from 'lucide-react'

type ChapterWithSubject = Chapter & { subjects: Subject }

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({})
  const [dueForRevision, setDueForRevision] = useState<ChapterWithSubject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile?.target_exam || !user) return
      const examSlug = profile.target_exam === 'BOTH' ? null : profile.target_exam.toLowerCase()

      let subQuery = supabase.from('subject_exams').select('subjects(id,name,slug,color), exams!inner(slug)')
      if (examSlug) subQuery = subQuery.eq('exams.slug', examSlug)
      const { data: subData } = await subQuery
      const uniqueSubjects = new Map<string, Subject>()
      for (const row of (subData as unknown as { subjects: Subject }[]) || []) {
        if (row.subjects) uniqueSubjects.set(row.subjects.id, row.subjects)
      }
      const subjectList = Array.from(uniqueSubjects.values())
      setSubjects(subjectList)

      const { data: progData } = await supabase.from('progress').select('*').eq('user_id', user.id)
      const pMap: Record<string, Progress> = {}
      for (const p of progData || []) pMap[p.chapter_id] = p as Progress
      setProgressMap(pMap)

      // Chapters studied more than 6 days ago -> due for revision
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      const staleChapterIds = (progData || [])
        .filter((p) => p.status !== 'not_started' && p.last_studied_at < sixDaysAgo)
        .map((p) => p.chapter_id)

      if (staleChapterIds.length > 0) {
        const { data: staleChapters } = await supabase
          .from('chapters')
          .select('*, subjects(*)')
          .in('id', staleChapterIds)
        setDueForRevision((staleChapters as ChapterWithSubject[]) || [])
      }

      setLoading(false)
    }
    load()
  }, [profile, user])

  const totalChapters = Object.keys(progressMap).length
  const doneCount = Object.values(progressMap).filter((p) => p.status === 'done').length
  const streak = doneCount > 0 ? Math.min(doneCount, 7) : 0

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink">
              Hey {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-slate mt-1">
              {profile?.target_exam === 'BOTH'
                ? 'Preparing for JEE & NEET'
                : `Preparing for ${profile?.target_exam}`}
            </p>
          </div>
          {streak > 0 && <StreakBadge days={streak} />}
        </div>

        {!loading && dueForRevision.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-soft bg-amber-soft/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock3 size={16} className="text-amber" />
              <h2 className="text-sm font-medium text-ink">Due for revision</h2>
            </div>
            <p className="text-xs text-slate mb-3">Chapters you studied 6+ days ago — time to revisit.</p>
            <div className="flex flex-wrap gap-2">
              {dueForRevision.map((ch) => (
                <Link
                  key={ch.id}
                  to={`/subjects/${ch.subjects.slug}/${ch.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-line text-sm text-ink hover:border-focus/40 transition-colors"
                >
                  <CircleDot size={12} className="text-amber" />
                  {ch.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-serif text-xl text-ink mb-4">Your subjects</h2>
        {loading ? (
          <p className="text-sm text-slate">Loading…</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((s) => (
              <Link
                key={s.id}
                to={`/subjects/${s.slug}`}
                className="group rounded-xl border border-line bg-white p-5 hover:border-focus/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <h3 className="font-medium text-ink">{s.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate group-hover:text-focus transition-colors">
                  Open <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalChapters > 0 && (
          <p className="text-xs text-slate mt-8">
            {doneCount} of {totalChapters} tracked chapters marked done
          </p>
        )}
      </div>
    </Layout>
  )
}
