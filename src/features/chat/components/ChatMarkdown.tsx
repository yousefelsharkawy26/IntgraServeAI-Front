// ============================================================
// Chat Markdown Renderer
// Premium markdown with syntax highlighting, tables, and more
// ============================================================

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'
import { ChatCodeBlock, InlineCode } from './ChatCodeBlock'

interface ChatMarkdownProps {
  content: string
  className?: string
}

export const ChatMarkdown = React.memo(function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={cn('chat-markdown prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed text-[15px]">{children}</p>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 mt-5 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 mt-4 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-2 mt-3 text-foreground">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mb-1.5 mt-3 text-foreground">{children}</h4>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline decoration-primary/40 underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="mb-3 space-y-1.5 list-disc pl-5 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 space-y-1.5 list-decimal pl-5 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[15px] leading-relaxed pl-1">{children}</li>
          ),

          // Code blocks
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '')
            const lang = match ? match[1] : ''
            const codeString = String(children).replace(/\n$/, '')

            // Inline code (no language, no newlines)
            if (!lang && !codeString.includes('\n')) {
              return <InlineCode>{children}</InlineCode>
            }

            // Code block
            return (
              <ChatCodeBlock
                code={codeString}
                language={lang || 'text'}
              />
            )
          },

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[13px]">{children}</td>
          ),

          // Strong / Em
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Strikethrough (via remark-gfm)
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">{children}</del>
          ),

          // Checkboxes (via remark-gfm)
          input: ({ checked }) => (
            <span className="inline-flex items-center mr-1.5">
              <span
                className={cn(
                  'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors',
                  checked
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30'
                )}
              >
                {checked && (
                  <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
