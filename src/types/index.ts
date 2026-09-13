export type Exam = {
  id: string
  name: string
  slug: string
}

export type Subject = {
  id: string
  name: string
  slug: string
  color: string
}

export type Chapter = {
  id: string
  subject_id: string
  name: string
  slug: string
  order_index: number
  description: string | null
}

export type Note = {
  id: string
  chapter_id: string
  title: string
  note_type: 'short' | 'detailed'
  content: string | null
  storage_path: string | null
  order_index: number
}

export type Video = {
  id: string
  chapter_id: string
  title: string
  youtube_id: string
  duration_seconds: number | null
  order_index: number
}

export type Pyq = {
  id: string
  chapter_id: string
  exam_name: string
  year: number | null
  question: string
  options: string[]
  correct_option: number
  explanation: string | null
}

export type Doubt = {
  id: string
  user_id: string
  chapter_id: string | null
  title: string
  body: string | null
  resolved: boolean
  created_at: string
  doubt_answers?: DoubtAnswer[]
  chapters?: { name: string } | null
}

export type DoubtAnswer = {
  id: string
  doubt_id: string
  user_id: string
  body: string
  is_accepted: boolean
  created_at: string
}

export type Progress = {
  user_id: string
  chapter_id: string
  status: 'not_started' | 'in_progress' | 'done'
  last_studied_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  target_exam: 'JEE' | 'NEET' | 'BOTH' | null
  created_at: string
}
