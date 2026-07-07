// ============================================================
// Chat Code Block - Premium syntax highlighting
// With copy button, language label, and line numbers option
// ============================================================

import React, { useState, useCallback } from 'react'
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

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const normalizedLang = normalizeLanguage(language)
  const displayLang = getLanguageLabel(normalizedLang)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group/code relative overflow-hidden rounded-xl border bg-[#1e1e2e] my-3',
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
            {filename || displayLang}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1 text-slate-400 opacity-0 transition-all group-hover/code:opacity-100 hover:text-slate-200 hover:bg-white/10"
            aria-label={expanded ? 'Collapse code' : 'Expand code'}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 opacity-0 transition-all group-hover/code:opacity-100 hover:text-slate-200 hover:bg-white/10"
            aria-label="Copy code"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-1 text-emerald-400"
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
            <Highlight
              theme={themes.vsDark}
              code={code.trim()}
              language={normalizedLang as any}
            >
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
                      <span className="table-cell select-none pr-4 text-right text-slate-600 text-[11px] w-8">
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
        'rounded-md bg-slate-100 px-1.5 py-0.5 text-[13px] font-mono text-slate-800 dark:bg-slate-800 dark:text-slate-200',
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
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'shell': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    '': 'text',
  }
  return langMap[lang] || lang || 'text'
}

function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'go': 'Go',
    'rust': 'Rust',
    'cpp': 'C++',
    'c': 'C',
    'csharp': 'C#',
    'ruby': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'sql': 'SQL',
    'bash': 'Bash',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'markdown': 'Markdown',
    'dockerfile': 'Dockerfile',
    'regex': 'Regex',
  }
  return labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
}
