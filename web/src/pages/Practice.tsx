import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type AnswerResult, type Question } from '../lib/api';

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'UPSC Polity', 'UPSC Geography', 'UPSC Economy', 'UPSC Environment'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];
const LETTERS = ['A', 'B', 'C', 'D'];

export default function Practice() {
  const [subject, setSubject] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  async function load(subj = subject, diff = difficulty) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.questions(subj, diff, 10);
      setQuestions(res.questions);
      setIndex(0);
      setChosen(null);
      setResult(null);
      setScore({ correct: 0, total: 0 });
      setFinished(false);
      if (!res.questions.length) setError('Is filter par abhi questions nahi hain — doosra subject try karo.');
    } catch (e: any) {
      setError(e?.message ?? 'Questions load nahi ho paaye.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load('All', 'All');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];

  async function submit(i: number) {
    if (result || !q) return;
    setChosen(i);
    try {
      const r = await api.answer(q.id, i);
      setResult(r);
      setScore((s) => ({ correct: s.correct + (r.correct ? 1 : 0), total: s.total + 1 }));
    } catch (e: any) {
      setError(e?.message ?? 'Answer submit nahi hua.');
      setChosen(null);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    setResult(null);
  }

  const pct = questions.length ? Math.round((score.correct / questions.length) * 100) : 0;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <span className="tag">Practice Arena</span>
        <h1>PYQ pattern par practice</h1>
        <p>Har answer ke saath explanation. Jo galat ho, wo Revision Planner mein automatically aa jaata hai.</p>
      </div>

      <div className="toolbar">
        <select className="select" value={subject} onChange={(e) => { setSubject(e.target.value); load(e.target.value, difficulty); }}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All subjects' : s}</option>
          ))}
        </select>
        <select className="select" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); load(subject, e.target.value); }}>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d === 'All' ? 'All levels' : d[0].toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => load()} disabled={loading}>
          ↻ Naya set
        </button>
        <div className="grow" />
        <span className="pill">Score: {score.correct}/{score.total}</span>
      </div>

      {error && <div className="error-strip" style={{ margin: 0 }}>{error}</div>}

      {loading && (
        <div className="q-card">
          <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 14, width: '45%', marginBottom: 24 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 48, marginBottom: 10 }} />
          ))}
        </div>
      )}

      {!loading && finished && (
        <div className="q-card">
          <div className="result-hero">
            <div className="score-ring" style={{ ['--pct' as any]: `${pct}%` }}>
              <span>{pct}%</span>
            </div>
            <h2>Set complete! 🎉</h2>
            <p className="muted">
              {score.correct} / {questions.length} correct
              {pct >= 80
                ? ' — shabaash, ye topic strong hai!'
                : pct >= 50
                ? ' — theek hai, thoda aur practice aur pukka ho jaayega.'
                : ' — chinta mat karo, Planner se revise karo phir dobara try karo.'}
            </p>
          </div>
          <div className="q-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => load()}>↻ Naya set</button>
            <Link to="/planner" className="btn btn-ghost">🗓️ Revision planner</Link>
            <Link to="/dash" className="btn btn-ghost">📊 Analytics dekho</Link>
          </div>
        </div>
      )}

      {!loading && !finished && q && (
        <div className="q-card">
          <div className="progress-line">
            {questions.map((_, i) => (
              <i
                key={i}
                className={
                  i === index ? 'current' : i < index ? 'done' : ''
                }
              />
            ))}
          </div>
          <div className="q-top">
            <span className="tag">{q.subject}</span>
            <span className="pill">{q.topic}</span>
            <span className="pill">{q.exam}</span>
            <span className="pill">{q.difficulty}</span>
            <span className="pill" style={{ marginLeft: 'auto' }}>{index + 1}/{questions.length}</span>
          </div>

          <div className="q-text">{q.question.hi || q.question.en}</div>

          <div className="options">
            {q.options.map((opt, i) => {
              let cls = 'option';
              if (result) {
                if (i === result.correctIndex) cls += ' correct';
                else if (i === chosen) cls += ' wrong';
              } else if (i === chosen) cls += ' selected';
              return (
                <button key={i} className={cls} onClick={() => submit(i)} disabled={Boolean(result)}>
                  <span className="letter">{LETTERS[i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {result && (
            <>
              <div className={`feedback ${result.correct ? 'ok' : 'no'}`}>
                <b>{result.correct ? '✅ Sahi jawab!' : '❌ Thoda chuk gaya'}</b>
                {result.explanation.hi || result.explanation.en}
              </div>
              <div className="q-actions">
                <button className="btn btn-primary" onClick={next}>
                  {index + 1 >= questions.length ? 'Result dekho →' : 'Agla question →'}
                </button>
                <Link to="/doubt" className="btn btn-ghost">💬 Is topic par doubt poocho</Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
