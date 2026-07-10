import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { Conversation, ConversationFilter } from '../types'
import { fetchConversationsPage, type ConversationsPage } from '../services/chat.service'

const PAGE_SIZE = 30
const MAX_CACHED_PAGES = 8

type ConversationMeta = Pick<Conversation, 'isPinned' | 'isFavorite' | 'isArchived'>
type ConversationMetaMap = Record<string, ConversationMeta>

interface UseChatConversationsOptions {
  userId: string
  userEmail: string
}

const getMetaStorageKey = (userId: string) => `integra-chat-conversation-meta:${userId}`

const readMeta = (userId: string): ConversationMetaMap => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(getMetaStorageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeMeta = (userId: string, meta: ConversationMetaMap) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getMetaStorageKey(userId), JSON.stringify(meta))
}

const mergeMeta = (conversation: Conversation, meta: ConversationMetaMap): Conversation => ({
  ...conversation,
  ...(meta[conversation.id] || {}),
})

const uniqueById = (items: Conversation[]): Conversation[] => {
  const seen = new Set<string>()
  const result: Conversation[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result
}

const applyFilter = (items: Conversation[], filter: ConversationFilter): Conversation[] => {
  switch (filter) {
    case 'pinned':
      return items.filter((item) => item.isPinned && !item.isArchived)
    case 'favorites':
      return items.filter((item) => item.isFavorite && !item.isArchived)
    case 'archived':
      return items.filter((item) => item.isArchived)
    case 'all':
    default:
      return items.filter((item) => !item.isArchived)
  }
}

export function useChatConversations({ userId, userEmail }: UseChatConversationsOptions) {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [meta, setMeta] = useState<ConversationMetaMap>(() => readMeta(userId))

  useEffect(() => {
    setMeta(readMeta(userId))
    setFilter('all')
    setSearchQuery('')
  }, [userId])

  const queryKey = useMemo(
    () => ['chat', 'conversations', userId, userEmail, searchQuery.trim()] as const,
    [userId, userEmail, searchQuery]
  )

  const query = useInfiniteQuery({
    queryKey,
    enabled: Boolean(userId && userEmail),
    initialPageParam: 1,
    maxPages: MAX_CACHED_PAGES,
    queryFn: ({ pageParam }) =>
      fetchConversationsPage({
        page: Number(pageParam),
        limit: PAGE_SIZE,
        customerEmail: userEmail,
        search: searchQuery.trim() || undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.page + 1 : undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const allConversations = useMemo(() => {
    const pages = query.data?.pages || []
    return uniqueById(
      pages
        .flatMap((page) => page.items)
        .map((conversation) => mergeMeta(conversation, meta))
    ).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [query.data, meta])

  const conversations = useMemo(
    () => applyFilter(allConversations, filter).filter((conversation) => conversation.messageCount > 0),
    [allConversations, filter]
  )

  const patchCachedConversation = useCallback((conversationId: string, patch: Partial<Conversation>) => {
    queryClient.setQueriesData<InfiniteData<ConversationsPage>>(
      { queryKey: ['chat', 'conversations', userId] },
      (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === conversationId ? { ...item, ...patch } : item
            ),
          })),
        }
      }
    )
  }, [queryClient, userId])

  const updateLocalMeta = useCallback((conversationId: string, updater: (current: ConversationMeta) => ConversationMeta) => {
    setMeta((currentMeta) => {
      const nextMeta = {
        ...currentMeta,
        [conversationId]: updater(currentMeta[conversationId] || {}),
      }
      writeMeta(userId, nextMeta)
      patchCachedConversation(conversationId, nextMeta[conversationId])
      return nextMeta
    })
  }, [patchCachedConversation, userId])

  const togglePinned = useCallback((conversationId: string) => {
    updateLocalMeta(conversationId, (current) => ({ ...current, isPinned: !current.isPinned }))
  }, [updateLocalMeta])

  const toggleFavorite = useCallback((conversationId: string) => {
    updateLocalMeta(conversationId, (current) => ({ ...current, isFavorite: !current.isFavorite }))
  }, [updateLocalMeta])

  const toggleArchived = useCallback((conversationId: string) => {
    updateLocalMeta(conversationId, (current) => ({ ...current, isArchived: !current.isArchived }))
  }, [updateLocalMeta])

  const upsertConversation = useCallback((conversation: Conversation) => {
    const merged = mergeMeta(conversation, meta)
    queryClient.setQueryData<InfiniteData<ConversationsPage>>(queryKey, (old) => {
      if (!old) {
        return {
          pageParams: [1],
          pages: [{ items: [merged], meta: { page: 1, limit: PAGE_SIZE, total: 1, has_more: false } }],
        }
      }

      const firstPage = old.pages[0]
      const withoutDuplicate = old.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== merged.id),
      }))

      return {
        ...old,
        pages: [
          { ...firstPage, items: [merged, ...withoutDuplicate[0].items] },
          ...withoutDuplicate.slice(1),
        ],
      }
    })
  }, [meta, queryClient, queryKey])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [query])

  return {
    ...query,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    conversations,
    allConversations,
    loadMore,
    togglePinned,
    toggleFavorite,
    toggleArchived,
    upsertConversation,
  }
}
