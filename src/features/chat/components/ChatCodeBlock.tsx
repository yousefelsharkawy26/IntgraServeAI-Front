// ============================================================
// Chat Code Block - Premium syntax highlighting
// With copy button, language label, line numbers, and collapse.
//
// Improvements:
// - Theme-aware (light/dark) via prefers-color-scheme detection.
//   Falls back gracefully when the user explicitly picks a theme.
// - Copy/collapse buttons are now keyboard-visible via
//   group-focus-within/code:opacity-100 (not just hover).
// - setTimeout for the "copied" state is cleared on unmount.
// - Line numbers are aria-hidden (decorative).
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Highlight, themes } from 'prism-react-renderer'
import { Check, Copy, ChevronDown, ChevronUp, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatCodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

export const ChatCodeBlock = React.memo(function ChatCodeBlock({
  code,
  language = 'text',
  filename,
  className,
}: ChatCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect the user's color scheme so the code block matches the app theme
  // instead of always rendering dark. We listen to matchMedia so switching
  // the OS theme (or the .dark class on <html>) updates the block live.
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => {
      // Prefer the explicit .dark class on <html> (set by themeStore),
      // fall back to the OS preference.
      setIsDark(document.documentElement.classList.contains('dark') || mq.matches)
    }
    update()
    mq.addEventListener('change', update)
    // Also observe the <html> class attribute so toggling theme via the UI
    // updates code blocks immediately.
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      mq.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [])

  // Clear the copied timeout on unmount to avoid setting state on an
  // unmounted component.
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can reject in non-secure contexts; fail silently.
    }
  }, [code])

  const normalizedLang = normalizeLanguage(language)
  const displayLang = getLanguageLabel(normalizedLang)
  const prismTheme = isDark ? themes.vsDark : themes.oneLight

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group/code relative overflow-hidden rounded-xl border my-3',
        isDark
          ? 'border-white/5 bg-[#1e1e2e]'
          : 'border-slate-200 bg-slate-50',
        className
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 border-b',
          isDark ? 'border-white/5' : 'border-slate-200'
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className={cn('h-3.5 w-3.5', isDark ? 'text-slate-400' : 'text-slate-500')} />
          <span
            className={cn(
              'text-[11px] font-medium uppercase tracking-wide',
              isDark ? 'text-slate-300' : 'text-slate-600'
            )}
          >
            {filename || displayLang}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse code' : 'Expand code'}
            aria-expanded={expanded}
            className={cn(
              'rounded-md p-1 opacity-0 transition-all',
              'group-hover/code:opacity-100 group-focus-within/code:opacity-100',
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            )}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleCopy}
            aria-label="Copy code"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] opacity-0 transition-all',
              'group-hover/code:opacity-100 group-focus-within/code:opacity-100',
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-1 text-emerald-500"
                >
                  <Check className="h-3 w-3" />
                  <span>Copied</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Code content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Highlight theme={prismTheme} code={code.trim()} language={normalizedLang as any}>
              {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  className={cn(
                    highlightClass,
                    'overflow-x-auto p-4 text-[13px] leading-relaxed scrollbar-thin'
                  )}
                  style={{ ...style, background: 'transparent', margin: 0 }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })} className="table-row">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'table-cell select-none pr-4 text-right text-[11px] w-8',
                          isDark ? 'text-slate-600' : 'text-slate-400'
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="table-cell">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// Inline code component
interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

export const InlineCode = React.memo(function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        'rounded-md bg-muted px-1.5 py-0.5 text-[13px] font-mono text-foreground/90',
        'dark:bg-muted/60',
        className
      )}
    >
      {children}
    </code>
  )
})

// Helper functions
function normalizeLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    md: 'markdown',
    '': 'text',
  }
  return langMap[lang] || lang || 'text'
}

function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    ruby: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kotlin: 'Kotlin',
    sql: 'SQL',
    bash: 'Bash',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    markdown: 'Markdown',
    dockerfile: 'Dockerfile',
    regex: 'Regex',
  }
  return labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
}