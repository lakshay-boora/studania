export type Exam = 'JEE' | 'NEET'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  exam: Exam | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  exam: Exam
  order_index: number
}

export interface Chapter {
  id: string
  subject_id: string
  name: string
  order_index: number
  notes_md: string | null
  video_url: string | null
  last_revised_at: string | null
}

export interface Pyq {
  id: string
  chapter_id: string
  year: number
  question: string
  options: string[] | null
  answer: string | null
  explanation: string | null
}

export interface Doubt {
  id: string
  user_id: string
  chapter_id: string | null
  title: string
  body: string
  tags: string[]
  created_at: string
  profiles?: { full_name: string | null }
  chapters?: { name: string }
}

export interface DoubtReply {
  id: string
  doubt_id: string
  user_id: string
  body: string
  created_at: string
  profiles?: { full_name: string | null }
}
