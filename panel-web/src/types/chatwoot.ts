export interface ChatwootMessage {
  id: number
  content: string | null
  message_type: 0 | 1 | 2 | 3  // 0=incoming, 1=outgoing, 2=activity, 3=template
  created_at: number             // Unix timestamp
  sender: {
    name: string
    type: string
  } | null
  attachments: ChatwootAttachment[]
}

export interface ChatwootAttachment {
  id: number
  message_id: number
  file_type: string
  data_url: string | null
  thumb_url: string | null
}

export interface ChatwootConversation {
  id: number
  status: string
  created_at: number
  meta?: {
    assignee?: { name: string }
  }
}
