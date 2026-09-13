import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { Chapter, Progress, Subject } from '../types'
import { CheckCircle2, Circle, CircleDashed, ChevronRight } from 'lucide-react'

export default function SubjectPage() {
  const { subjectSlug } = useParams()
  const { user } = useAuth()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: subData } = await supabase.from('subjects').select('*').eq('slug', subjectSlug).single()
      setSubject(subData)

      if (subData) {
        const { data: chapData } = await supabase
          .from('chapters')
          .select('*')
          .eq('subject_id', subData.id)
          .order('order_index')
        setChapters(chapData || [])

        if (user) {
          const { data: progData } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', user.id)
            .in('chapter_id', (chapData || []).map((c) => c.id))
          const pMap: Record<string, Progress> = {}
          for (const p of progData || []) pMap[p.chapter_id] = p as Progress
          setProgressMap(pMap)
        }
      }
      setLoading(false)
    }
    load()
  }, [subjectSlug, user])

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-8 py-10 text-slate text-sm">Loading…</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-serif font-semibold" style={{ background: subject?.color }}>
            {subject?.name[0]}
          </span>
          <h1 className="font-serif text-2xl text-ink">{subject?.name}</h1>
        </div>
        <p className="text-slate mb-8 text-sm">{chapters.length} chapters in syllabus order</p>

        <div className="rounded-xl border border-line bg-white divide-y divide-line overflow-hidden">
          {chapters.map((c, i) => {
            const status = progressMap[c.id]?.status || 'not_started'
            return (
              <Link
                key={c.id}
                to={`/subjects/${subjectSlug}/${c.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-paper-dim/60 transition-colors group"
              >
                <span className="text-sm text-slate/60 w-5 text-right tabular-nums">{i + 1}</span>
                <StatusIcon status={status} />
                <div className="flex-1 min-w-0">
                  <p className="text-ink font-medium truncate">{c.name}</p>
                  {c.description && <p className="text-sm text-slate truncate">{c.description}</p>}
                </div>
                <ChevronRight size={16} className="text-slate/50 group-hover:text-ink shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle2 size={18} className="text-sage shrink-0" />
  if (status === 'in_progress') return <CircleDashed size={18} className="text-amber shrink-0" />
  return <Circle size={18} className="text-line shrink-0" />
}
