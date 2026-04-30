'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, User } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export default function ChatWindow({ chatId, userId }: { chatId: string, userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
      scrollToBottom()
    }

    fetchMessages()

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageContent = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: userId,
      content: messageContent,
    })

    if (error) {
      console.error('Error sending message:', error)
      // Potentially revert local state or show error
    }
  }

  return (
    <Card className="flex flex-col h-[600px] rounded-3xl overflow-hidden border-primary/10 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Conversation</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> Online
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.sender_id === userId
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-card border rounded-tl-none'
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 opacity-70 ${msg.sender_id === userId ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-card border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="rounded-xl h-11 border-muted focus-visible:ring-primary"
        />
        <Button type="submit" size="icon" className="h-11 w-11 rounded-xl bg-primary hover:bg-accent shrink-0">
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </Card>
  )
}
