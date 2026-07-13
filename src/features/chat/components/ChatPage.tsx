// ============================================================
// Chat Page - Widget host
// ============================================================

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { MessageCircle, Settings2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ChatWidget } from './ChatWidget'
import { ConfigurationSettingsDrawer } from './configuration/ConfigurationSettingsDrawer'
import { useAuthStore } from '@/store/authStore'
import '../chat.css'

export default function ChatPage() {
  const authUser = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = authUser.roles?.includes('Admin')

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 shadow-sm sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
      {isAdmin && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-4 top-4 z-20 gap-2 rounded-full bg-background/80 shadow-sm backdrop-blur sm:right-6 sm:top-6"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Configuration Settings</span>
        </Button>
      )}
      <div className="relative z-10 flex min-h-[420px] items-center justify-center text-center">
        <div className="mx-auto max-w-xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              IntegraServe AI chat is now a widget
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Use the floating button in the bottom-right corner to open the lightweight chat experience.
              Conversation state is stored in the frontend, so the browser URL stays on /chat.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Open the widget to start chatting</span>
          </div>
        </div>
      </div>

      <ChatWidget
        customerEmail={authUser.email}
        customerName={authUser.name || 'Customer'}
        token={accessToken}
      />

      {isAdmin && (
        <ConfigurationSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </div>
  )
}
