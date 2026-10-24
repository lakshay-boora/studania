import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type PlanTask } from '../lib/api';

function prettyDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (iso === today) return 'Aaj';
  if (iso === tomorrow) return 'Kal';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Planner() {
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [exam, setExam] = useState('JEE');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .planner()
      .then((p) => {
        setTasks(p.tasks);
        setExam(p.exam);
        setNote(p.note);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle(task: PlanTask) {
    const nextDone = !done[task.id];
    setDone((d) => ({ ...d, [task.id]: nextDone }));
    api.completeTask(task.id, nextDone).catch(() => {});
  }

  const grouped = tasks.reduce<Record<string, PlanTask[]>>((acc, t) => {
    (acc[t.due] ||= []).push(t);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();
  const totalDone = Object.values(done).filter(Boolean).length;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <span className="tag">Revision Planner</span>
        <h1>Aapka {exam} revision plan</h1>
        <p>{note || 'Spaced repetition 1-3-7-15 — kamzor topics pehle, phir exam-weighted core.'}</p>
      </div>

      <div className="toolbar">
        <span className="pill">📌 {tasks.length} tasks</span>
        <span className="pill" style={{ background: 'var(--mint-soft)', color: '#0f6b58' }}>
          ✓ {totalDone} done
        </span>
        <span className="pill">Ladder: 1 · 3 · 7 · 15 din</span>
        <div className="grow" />
        <Link to="/practice" className="btn btn-ghost btn-sm">Practice Arena →</Link>
      </div>

      {loading && (
        <div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 64, marginBottom: 10 }} />
          ))}
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="empty card">
          <div className="big">🗓️</div>
          <h3>Plan ban raha hai…</h3>
          <p className="muted">Thoda practice karo, phir plan aapke weak topics ke hisaab se banega.</p>
        </div>
      )}

      {!loading &&
        dates.map((date) => (
          <div className="plan-day" key={date}>
            <div className="plan-date">
              {prettyDate(date)}
              <span className="pill">{grouped[date].length} tasks</span>
              {date <= new Date().toISOString().slice(0, 10) && (
                <span className="pill" style={{ background: '#fff3e0', color: '#b45309' }}>due</span>
              )}
            </div>
            {grouped[date].map((t) => (
              <div key={t.id} className={`task ${t.priority === 'high' ? 'high' : ''} ${done[t.id] ? 'done' : ''}`}>
                <button className="task-check" onClick={() => toggle(t)} aria-label="Mark done">
                  {done[t.id] ? '✓' : ''}
                </button>
                <div className="grow">
                  <div className="task-title">{t.title}</div>
                  <div className="task-reason">
                    {t.priority === 'high' && <strong style={{ color: '#b45309' }}>Weak topic · </strong>}
                    {t.reason}
                  </div>
                </div>
                <div className="task-side">
                  <div className="pill">{t.kind}</div>
                  <div className="mins">{t.minutes} min</div>
                </div>
              </div>
            ))}
          </div>
        ))}

      <div className="card" style={{ marginTop: 20, background: 'var(--indigo-100)', border: 'none' }}>
        <h3>Spaced repetition kaise kaam karta hai?</h3>
        <p style={{ margin: 0 }} className="muted">
          Insaan ka brain bhoolta hai — isliye har topic ko 1, 3, 7 aur 15 din baad dobara dekhna
          padta hai. Angvey aapki accuracy dekhkar tay karta hai kaunsa topic kab repeat ho.
          <strong> Kamzor topic pehle, phir exam-weighted syllabus.</strong>
        </p>
      </div>
    </div>
  );
}
