"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import MessageBubble from "./MessageBubble"
import { MessageSquare, Send, Smile, PhoneCall, PhoneOff, Clock } from "lucide-react"
import type { ChatwootMessage } from "@/types/chatwoot"

const EMOJIS = [
  "😊","😀","😂","😅","😍","🤔","😢","😡","🥹","😎",
  "🙏","👍","👎","👋","🤝","💪","✅","❌","⭐","🎉",
  "🔥","💬","📞","📱","🚗","🏠","💰","📅","⏰","✉️",
  "❤️","💙","💚","🌟","💡","🔑","📋","🚀","🎯","🤩",
]

interface ConversationThreadProps {
  messages: ChatwootMessage[] | null
  error?: string
  conversacionTomada: boolean
  leadId: number
}

export default function ConversationThread({
  messages: initialMessages,
  error,
  conversacionTomada: initialTomada,
  leadId,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<ChatwootMessage[]>(initialMessages ?? [])
  const [tomada, setTomada] = useState(initialTomada)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [takingConv, setTakingConv] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [showBlockedModal, setShowBlockedModal] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Polling: actualiza mensajes cada 8 segundos mientras la conversación está tomada
  useEffect(() => {
    if (!tomada) return

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/leads/${leadId}/mensajes`)
        if (!res.ok) return
        const data = await res.json()
        const incoming: ChatwootMessage[] = data.messages ?? []
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newOnes = incoming.filter((m) => !existingIds.has(m.id))
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev
        })
      } catch {
        // Silencioso — no interrumpir la UX si falla un poll
      }
    }

    const interval = setInterval(fetchMessages, 8000)
    return () => clearInterval(interval)
  }, [tomada, leadId])

  // Cerrar emoji picker al hacer click afuera
  useEffect(() => {
    if (!showEmoji) return
    function handler(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showEmoji])

  function isWithin24Hours(): boolean {
    if (messages.length === 0) return true // sin mensajes, permitir
    const last = messages[messages.length - 1]
    const secondsElapsed = Date.now() / 1000 - last.created_at
    return secondsElapsed <= 86400 // 24hs en segundos
  }

  async function setConversacionTomada(value: boolean) {
    if (value && !isWithin24Hours()) {
      setShowBlockedModal(true)
      return
    }
    setTakingConv(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/tomar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tomada: value }),
      })
      if (res.ok) setTomada(value)
    } finally {
      setTakingConv(false)
    }
  }

  async function handleSend() {
    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    setSendError(null)
    setText("")
    setShowEmoji(false)

    // Optimistic update
    const tempId = Date.now()
    const tempMsg: ChatwootMessage = {
      id: tempId,
      content,
      message_type: 1,
      created_at: Math.floor(Date.now() / 1000),
      sender: { name: "Ignacio Serra", type: "user" },
      attachments: [],
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch(`/api/leads/${leadId}/mensaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        setSendError("No se pudo enviar el mensaje. Intentá de nuevo.")
        setText(content)
      } else {
        // Reemplazar estado con mensajes reales para eliminar el optimista
        const poll = await fetch(`/api/leads/${leadId}/mensajes`)
        if (poll.ok) {
          const data = await poll.json()
          setMessages(data.messages ?? [])
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setSendError("Error de conexión.")
      setText(content)
    } finally {
      setSending(false)
    }
  }

  function addEmoji(emoji: string) {
    setText((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Mostrar footer solo si hay conversación configurada
  const hasConversation = initialMessages !== null || !!error

  return (
    <>
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare size={14} className="text-zinc-400" />
          Conversación WhatsApp
          {messages.length > 0 && (
            <span className="text-xs text-zinc-400 font-normal">
              ({messages.length} mensajes)
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {error && (
          <p className="text-sm text-zinc-400 text-center py-8">
            No se pudo cargar la conversación
          </p>
        )}
        {!error && initialMessages === null && (
          <p className="text-sm text-zinc-400 text-center py-8">
            Sin conversación registrada
          </p>
        )}
        {!error && initialMessages !== null && messages.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-8">
            La conversación no tiene mensajes aún
          </p>
        )}
        {messages.length > 0 && (
          <div className="space-y-3 bg-zinc-50 rounded-lg p-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </CardContent>

      {/* Footer: tomar conversación o input de mensaje */}
      {hasConversation && (
        <div className="border-t border-zinc-100 p-3 flex-shrink-0">
          {!tomada ? (
            <Button
              onClick={() => setConversacionTomada(true)}
              disabled={takingConv}
              className="w-full gap-2 text-white"
              style={{ backgroundColor: "#EB0A1E" }}
            >
              <PhoneCall size={15} />
              {takingConv ? "Tomando..." : "Tomar conversación"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={() => setConversacionTomada(false)}
                  disabled={takingConv}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <PhoneOff size={13} />
                  Liberar conversación
                </button>
              </div>
              {sendError && (
                <p className="text-xs text-red-500 px-1">{sendError}</p>
              )}
              <div className="relative" ref={emojiRef}>
                {/* Emoji picker */}
                {showEmoji && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white border border-zinc-200 rounded-xl shadow-lg p-2 z-20 w-72">
                    <div className="grid grid-cols-10 gap-0.5">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => addEmoji(e)}
                          className="text-xl hover:bg-zinc-100 rounded p-0.5 leading-none transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="Emojis"
                  >
                    <Smile size={18} />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí un mensaje… (Enter para enviar)"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 overflow-y-auto"
                    style={{ maxHeight: "8rem" }}
                  />

                  <Button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    size="sm"
                    className="flex-shrink-0 text-white h-9 w-9 p-0"
                    style={{ backgroundColor: "#EB0A1E" }}
                    title="Enviar"
                  >
                    <Send size={15} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>

    {/* Modal ventana 24hs */}
    <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            No se puede tomar la conversación
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-600 leading-relaxed">
          El último mensaje de esta conversación tiene más de 24 horas de antigüedad.
          WhatsApp no permite enviar mensajes fuera de la ventana de atención de 24 horas
          sin utilizar una plantilla aprobada.
        </p>
        <DialogFooter>
          <Button onClick={() => setShowBlockedModal(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
