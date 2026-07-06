import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  Tag,
  MessageSquare,
  StickyNote,
  Activity,
  Send,
  Paperclip,
} from 'lucide-react'
import { useTicketDetail, useTicketMutations } from '../hooks/useTickets'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { TICKET_STATUSES, TICKET_STATUS_CONFIG } from '@/constants/tickets'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ticket, isLoading } = useTicketDetail(id || '')
  const { changeStatus, assignTicket, addMessage, addNote } = useTicketMutations()
  const [replyText, setReplyText] = useState('')
  const [noteText, setNoteText] = useState('')

  if (isLoading || !ticket) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const handleStatusChange = (newStatus: string) => {
    changeStatus.mutate({ id: ticket.id, status: newStatus })
  }

  const handleReply = () => {
    if (!replyText.trim()) return
    addMessage.mutate({ id: ticket.id, content: replyText.trim() })
    setReplyText('')
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNote.mutate({ id: ticket.id, content: noteText.trim() })
    setNoteText('')
  }

  const messages = ticket.messages || []
  const notes = ticket.internalNotes || []
  const activities = ticket.activityLog || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-text-muted)]">#{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="mt-0.5 text-lg font-semibold text-[var(--color-text-primary)]">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="conversation" className="w-full">
            <TabsList className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-0.5">
              <TabsTrigger value="conversation" className="gap-1.5 text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white">
                <MessageSquare className="h-3.5 w-3.5" />
                Conversation
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white">
                <StickyNote className="h-3.5 w-3.5" />
                Internal Notes
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white">
                <Activity className="h-3.5 w-3.5" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="mt-3">
              <Card className="border-[var(--color-border-light)]">
                <CardContent className="p-4 space-y-4">
                  {/* Customer original description */}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white bg-gradient-to-br from-green-400 to-teal-500">
                      {ticket.customerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{ticket.customerName}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {new Date(ticket.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{ticket.description}</p>
                    </div>
                  </div>

                  {messages.length > 0 && <Separator />}

                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                        msg.sender === 'ai' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                        msg.sender === 'customer' ? 'bg-gradient-to-br from-green-400 to-teal-500' :
                        'bg-gradient-to-br from-blue-400 to-purple-500'
                      }`}>
                        {msg.senderName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{msg.senderName}</span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Reply */}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white">
                      A
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[80px] rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)] text-sm resize-none"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-full">
                          <Paperclip className="h-3.5 w-3.5" />
                          Attach
                        </Button>
                        <Button size="sm" className="h-8 gap-1.5 text-xs rounded-full bg-[var(--color-text-primary)]" onClick={handleReply}>
                          <Send className="h-3.5 w-3.5" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <Card className="border-[var(--color-border-light)]">
                <CardContent className="p-4 space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-yellow-100 bg-yellow-50/50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">{note.authorName}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{note.content}</p>
                    </div>
                  ))}

                  {notes.length === 0 && (
                    <p className="text-xs text-[var(--color-text-muted)] text-center py-4">No internal notes added yet.</p>
                  )}

                  <Separator />

                  {/* Add note text */}
                  <div>
                    <Textarea
                      placeholder="Add an internal note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="min-h-[60px] rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)] text-sm resize-none"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" className="h-8 gap-1.5 text-xs rounded-full bg-[var(--color-text-primary)]" onClick={handleAddNote}>
                        <StickyNote className="h-3.5 w-3.5" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              <Card className="border-[var(--color-border-light)]">
                <CardContent className="p-4">
                  <div className="relative space-y-4 pl-4 before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-[var(--color-border-light)]">
                    {activities.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-surface)] bg-[var(--color-accent-blue)]" />
                        <p className="text-sm text-[var(--color-text-primary)]">{act.action}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          by {act.actorName} at {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Actions */}
          <Card className="border-[var(--color-border-light)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Change Status</label>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="mt-1 h-9 rounded-lg border-[var(--color-border-medium)] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{TICKET_STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!ticket.assignedTo && (
                <Button variant="outline" className="w-full h-9 text-xs rounded-full bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue)]/90" onClick={() => assignTicket.mutate({ id: ticket.id })}>
                  Assign to Me
                </Button>
              )}
              {ticket.status !== 'escalated' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <Button variant="outline" className="w-full h-9 text-xs rounded-full" onClick={() => changeStatus.mutate({ id: ticket.id, status: 'escalated' })}>
                  Escalate Ticket
                </Button>
              )}
              {ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                <Button variant="outline" className="w-full h-9 text-xs rounded-full text-red-600 hover:bg-red-50" onClick={() => changeStatus.mutate({ id: ticket.id, status: 'closed' })}>
                  Close Ticket
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card className="border-[var(--color-border-light)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-primary)]">{ticket.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{ticket.customerEmail}</span>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  SLA Deadline
                </div>
                <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
                  {ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <Card className="border-[var(--color-border-light)]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[var(--color-bg-base)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
