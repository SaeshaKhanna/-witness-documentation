export interface Case {
  id: string
  user_id: string
  name: string
  status: 'active' | 'draft' | 'sealed'
  created_at: string
  updated_at: string
}

export interface Memory {
  id: string
  case_id: string
  user_id: string
  title: string
  content: string
  memory_type: 'event' | 'emotion' | 'sensory' | 'person' | 'location' | 'evidence'
  confidence: 'high' | 'medium' | 'low' | 'verified'
  approximate_date: string | null
  map_x: number | null
  map_y: number | null
  created_at: string
  updated_at: string
}

export interface Evidence {
  id: string
  case_id: string
  user_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  sha256_hash: string
  uploaded_at?: string
  created_at: string
}

export interface MemoryLink {
  id: string
  from_memory_id: string
  to_memory_id: string
  link_type: string
  created_at: string
}

export interface Notification {
  id: string
  type: 'signin' | 'case' | 'memory' | 'evidence' | 'info'
  title: string
  message: string
  read: boolean
  timestamp: string
}

export type MemoryColor = 'teal' | 'rose' | 'violet' | 'amber' | 'sky'

export const MEMORY_COLOR: Record<Memory['memory_type'], MemoryColor> = {
  event: 'teal',
  emotion: 'amber',
  sensory: 'violet',
  person: 'rose',
  location: 'sky',
  evidence: 'rose',
}
