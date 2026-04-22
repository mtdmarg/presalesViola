import { formatUnixTimestamp } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { ChatwootMessage } from "@/types/chatwoot"

interface MessageBubbleProps {
  message: ChatwootMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  // 0 = incoming (cliente), 1 = outgoing (bot/agente)
  const isOutgoing = message.message_type === 1
  const rawName = message.sender?.name ?? ""
  const senderName = rawName === "Ignacio Serra"
    ? "Mica - Toyota Viola"
    : rawName || (isOutgoing ? "Mica - Toyota Viola" : "Cliente")

  if (!message.content) return null

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] space-y-1")}>
        <p className={cn("text-xs text-zinc-400", isOutgoing ? "text-right" : "text-left")}>
          {senderName}
        </p>
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
            isOutgoing
              ? "bg-zinc-800 text-white rounded-tr-sm"
              : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm"
          )}
        >
          {message.content}
        </div>
        <p className={cn("text-xs text-zinc-300", isOutgoing ? "text-right" : "text-left")}>
          {formatUnixTimestamp(message.created_at)}
        </p>
      </div>
    </div>
  )
}
