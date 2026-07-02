import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code, Copy, Check, Palette, MessageSquare, Monitor } from 'lucide-react'
import { IntegraServeChat } from './IntegraServeChat'
import { DEFAULT_CHAT_CONFIG } from '../types'
import type { ChatConfig } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ChatWidgetPage() {
  const [config, setConfig] = useState<ChatConfig>({ ...DEFAULT_CHAT_CONFIG })
  const [copied, setCopied] = useState(false)

  const embedCode = `<IntegraServeChat
  config={{
    theme: "${config.theme}",
    primaryColor: "${config.primaryColor}",
    position: "${config.position}",
    welcomeMessage: "${config.welcomeMessage}",
    companyName: "${config.companyName}",
    borderRadius: ${config.borderRadius}
  }}
/>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">Configure and preview your embeddable chat widget</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <Card className="border-[var(--color-border-light)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-[var(--color-text-muted)]" />
              Widget Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">Theme</Label>
                <div className="mt-1.5 flex rounded-lg border border-[var(--color-border-medium)] p-0.5">
                  <button
                    onClick={() => setConfig({ ...config, theme: 'light' })}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors',
                      config.theme === 'light'
                        ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Light
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, theme: 'dark' })}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors',
                      config.theme === 'dark'
                        ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Dark
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Position</Label>
                <div className="mt-1.5 flex rounded-lg border border-[var(--color-border-medium)] p-0.5">
                  <button
                    onClick={() => setConfig({ ...config, position: 'left' })}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors',
                      config.position === 'left'
                        ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, position: 'right' })}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors',
                      config.position === 'right'
                        ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-base)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Primary Color</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-9 w-9 rounded-md border border-[var(--color-border-medium)] cursor-pointer"
                />
                <Input value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className="h-9 text-xs flex-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Company Name</Label>
              <Input value={config.companyName} onChange={(e) => setConfig({ ...config, companyName: e.target.value })} className="mt-1.5 h-9 text-xs" />
            </div>

            <div>
              <Label className="text-xs font-medium">Welcome Message</Label>
              <Input value={config.welcomeMessage} onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} className="mt-1.5 h-9 text-xs" />
            </div>

            <div>
              <Label className="text-xs font-medium">Border Radius</Label>
              <input
                type="range"
                min={0}
                max={32}
                value={config.borderRadius}
                onChange={(e) => setConfig({ ...config, borderRadius: Number(e.target.value) })}
                className="mt-2 w-full"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{config.borderRadius}px</p>
            </div>
          </CardContent>
        </Card>

        {/* Embed Code */}
        <Card className="border-[var(--color-border-light)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="h-4 w-4 text-[var(--color-text-muted)]" />
              Embed Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg bg-slate-800 dark:bg-slate-900 p-4">
              <pre className="text-xs text-slate-200 overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2 h-7 gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="mt-4 rounded-lg bg-[var(--color-bg-base)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">
                Copy this code and paste it before the closing <code className="text-[var(--color-text-primary)]">&lt;/body&gt;</code> tag on your website.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Note */}
      <div className="rounded-lg border border-dashed border-[var(--color-border-medium)] bg-[var(--color-bg-base)] p-4 text-center">
        <MessageSquare className="mx-auto h-6 w-6 text-[var(--color-text-muted)]" />
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          A live preview of the chat widget is available in the bottom-{config.position} corner of this page.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">Click the floating button to open it.</p>
      </div>

      {/* Live Chat Widget */}
      <IntegraServeChat config={config} />
    </motion.div>
  )
}
