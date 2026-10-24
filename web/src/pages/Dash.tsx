import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Stats } from '../lib/api';

const EXAMS = ['JEE', 'NEET', 'UPSC'];

export default function Dash() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  function refresh() {
    api.stats().then((s) => {
      setStats(s);
      setName(s.user.name);
    }).catch(() => {});
  }

  useEffect(refresh, []);

  async function saveExam(exam: string) {
    await api.updateProfile({ exam }).catch(() => {});
    refresh();
  }

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    await api.updateProfile({ name }).catch(() => {});
    setSaving(false);
    refresh();
  }

  if (!stats) {
    return (
      <div className="page-wrap">
        <div className="skeleton" style={{ height: 40, width: 260, marginBottom: 20 }} />
        <div className="dash-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 90 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  const maxDay = Math.max(1, ...stats.last7Days.map((d) => d.attempted));
  const hasData = stats.totals.attempts > 0 || stats.totals.doubtsAsked > 0;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <span className="tag">My Dash</span>
        <h1>Hi {stats.user.name} 👋</h1>
        <p>Yahan dikhta hai aapki asli tayyari — guesses nahi, data.</p>
      </div>

      <div className="toolbar">
        <span className="small muted">Exam:</span>
        {EXAMS.map((e) => (
          <button
            key={e}
            className={`chip ${stats.user.exam === e ? 'active' : ''}`}
            onClick={() => saveExam(e)}
          >
            {e}
          </button>
        ))}
        <div className="grow" />
        <input
          className="select"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aapka naam"
          style={{ minWidth: 150 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={saveName} disabled={saving}>
          Save
        </button>
      </div>

      <div className="dash-grid">
        <div className="metric">
          <div className="label">Streak</div>
          <div className="value">🔥 {stats.user.streak}</div>
          <div className="sub">din lagatar</div>
        </div>
        <div className="metric">
          <div className="label">Doubts poochhe</div>
          <div className="value">{stats.totals.doubtsAsked}</div>
          <div className="sub">aaj: {stats.user.doubtsToday}</div>
        </div>
        <div className="metric">
          <div className="label">Accuracy</div>
          <div className="value">{stats.totals.accuracy}%</div>
          <div className="sub">
            {stats.totals.correct}/{stats.totals.attempts} correct
          </div>
        </div>
        <div className="metric">
          <div className="label">Plan</div>
          <div className="value" style={{ fontSize: '1.4rem', textTransform: 'capitalize' }}>
            {stats.user.plan === 'sahaj' ? 'Sahaj' : stats.user.plan}
          </div>
          <div className="sub">{stats.user.plan === 'sahaj' ? 'Free tier' : 'Active'}</div>
        </div>
      </div>

      {!hasData && (
        <div className="card empty">
          <div className="big">🌱</div>
          <h3>Abhi shuruaat hai</h3>
          <p className="muted">Ek doubt poocho ya ek practice set karo — yahan aapka progress dikhne lagega.</p>
          <div className="q-actions" style={{ justifyContent: 'center' }}>
            <Link to="/doubt" className="btn btn-primary">💬 Pehla doubt poocho</Link>
            <Link to="/practice" className="btn btn-ghost">🎯 Practice karo</Link>
          </div>
        </div>
      )}

      {hasData && (
        <div className="grid-2">
          <div className="card">
            <h3>Subject-wise accuracy</h3>
            {stats.subjects.length === 0 && (
              <p className="muted small">Practice karne ke baad yahan subject breakdown aayega.</p>
            )}
            {stats.subjects.map((s) => (
              <div className="bar-row" key={s.subject}>
                <span>{s.subject}</span>
                <div className="bar">
                  <i className={s.accuracy < 50 ? 'low' : ''} style={{ width: `${s.accuracy}%` }} />
                </div>
                <span className="pct">{s.accuracy}%</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Pichhle 7 din</h3>
            <div className="activity">
              {stats.last7Days.map((d) => (
                <div className="day" key={d.date} title={`${d.correct} correct / ${d.attempted} attempted`}>
                  <div className="bars">
                    {d.correct > 0 && (
                      <i className="correct" style={{ height: `${(d.correct / maxDay) * 100}%` }} />
                    )}
                    {d.attempted - d.correct > 0 && (
                      <i style={{ height: `${((d.attempted - d.correct) / maxDay) * 100}%` }} />
                    )}
                  </div>
                  <span>{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
                </div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
              🟩 correct · 🟪 attempted
            </p>
          </div>

          <div className="card">
            <h3>Kamzor topics</h3>
            {stats.weakTopics.length === 0 ? (
              <p className="muted small">Abhi tak koi weak topic nahi — mast! Practice continue karo.</p>
            ) : (
              stats.weakTopics.map((t) => (
                <div className="bar-row" key={`${t.subject}-${t.topic}`} style={{ gridTemplateColumns: '1fr 44px' }}>
                  <span>
                    <strong>{t.topic}</strong>
                    <br />
                    <span className="small muted">{t.subject}</span>
                  </span>
                  <span className="pct" style={{ color: 'var(--coral)' }}>{t.accuracy}%</span>
                </div>
              ))
            )}
            <Link to="/planner" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
              🗓️ Planner mein add karo
            </Link>
          </div>

          <div className="card">
            <h3>Doubt topics</h3>
            {Object.keys(stats.doubtsBySubject).length === 0 ? (
              <p className="muted small">Abhi koi doubt nahi poocha.</p>
            ) : (
              Object.entries(stats.doubtsBySubject).map(([subject, count]) => {
                const total = Object.values(stats.doubtsBySubject).reduce((a, b) => a + b, 0);
                const pct = Math.round((count / total) * 100);
                return (
                  <div className="bar-row" key={subject}>
                    <span>{subject}</span>
                    <div className="bar">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <span className="pct">{count}</span>
                  </div>
                );
              })
            )}
            <Link to="/doubt" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
              💬 Naya doubt poocho
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
