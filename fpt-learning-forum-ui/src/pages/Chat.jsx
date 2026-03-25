import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Smile } from 'lucide-react'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'
import { useChat } from '../lib/chat'
import { fetchJson } from '../lib/api'

const DM_REACTIONS = ['👍', '❤️', '😂', '😮', '😢']

export default function Chat() {
  const { peerId } = useParams()
  const nav = useNavigate()
  const { user: me, auth, isSignedIn } = useAuth()
  const { socket, connected } = useChat()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sendBusy, setSendBusy] = useState(false)
  const [openReactionPickerId, setOpenReactionPickerId] = useState(null)
  const bottomRef = useRef(null)

  const peerKey = peerId ? String(peerId) : ''

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    if (!isSignedIn || !auth?.token) return
    let cancelled = false
    async function load() {
      setLoadingList(true)
      try {
        const rows = await fetchJson('/api/messages/conversations', {
          headers: { Authorization: `Bearer ${auth.token}` }
        })
        if (!cancelled) setConversations(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setConversations([])
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isSignedIn, auth?.token])

  useEffect(() => {
    if (!peerKey || !auth?.token) {
      setMessages([])
      return
    }
    let cancelled = false
    async function loadThread() {
      setLoadingThread(true)
      try {
        const list = await fetchJson(`/api/messages/with/${peerKey}`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        })
        if (!cancelled) setMessages(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setLoadingThread(false)
      }
    }
    loadThread()
    return () => {
      cancelled = true
    }
  }, [peerKey, auth?.token])

  useEffect(() => {
    if (!socket || !peerKey) return undefined
    function onDm(msg) {
      if (!msg) return
      const a = String(msg.fromId)
      const b = String(msg.toId)
      const meId = String(me?._id || '')
      const other = a === meId ? b : a === meId ? b : null
      const involves =
        (a === meId && b === peerKey) || (b === meId && a === peerKey)
      if (!involves) return
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev
        return [...prev, msg]
      })
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c.peerId) === peerKey)
        const peerLabel =
          String(msg.fromId) === meId
            ? msg.toName || 'Thành viên'
            : msg.fromName || 'Thành viên'
        const row = {
          peerId: peerKey,
          peerName: prev[idx]?.peerName || peerLabel,
          lastText: msg.text,
          lastAt: msg.createdAt
        }
        if (idx < 0) return [row, ...prev]
        const next = [...prev]
        next[idx] = { ...next[idx], lastText: msg.text, lastAt: msg.createdAt }
        return [...next].sort(
          (x, y) => new Date(y.lastAt).getTime() - new Date(x.lastAt).getTime()
        )
      })
    }
    socket.on('dm', onDm)
    function onDmUpdate(updated) {
      if (!updated?._id) return
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(updated._id) ? { ...m, ...updated } : m))
      )
    }
    socket.on('dm:update', onDmUpdate)
    return () => {
      socket.off('dm', onDm)
      socket.off('dm:update', onDmUpdate)
    }
  }, [socket, peerKey, me?._id])

  useEffect(() => {
    scrollBottom()
  }, [messages, peerKey, scrollBottom])

  async function send() {
    const t = text.trim()
    if (!t || !socket || !peerKey || sendBusy) return
    setSendBusy(true)
    socket.emit('dm:send', { toUserId: peerKey, text: t }, (res) => {
      setSendBusy(false)
      if (res?.ok && res.message) {
        setText('')
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(res.message._id))) return prev
          return [...prev, res.message]
        })
      }
    })
  }

  function toggleReaction(messageId, emoji) {
    if (!socket || !messageId) return
    socket.emit('dm:react', { messageId, emoji }, () => {})
  }

  function summarizeReactions(message) {
    const list = Array.isArray(message?.reactions) ? message.reactions : []
    const map = new Map()
    for (const r of list) {
      const key = String(r.emoji || '')
      if (!key) continue
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }))
  }

  function shortTime(value) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const activePeerName = useMemo(() => {
    const row = conversations.find((c) => String(c.peerId) === peerKey)
    return row?.peerName || 'Người dùng'
  }, [conversations, peerKey])

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-soft text-sm text-slate-600">
        Vui lòng{' '}
        <Link to="/login" className="font-semibold text-sky-700">
          đăng nhập
        </Link>{' '}
        để dùng tin nhắn.
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
      <Card>
        <CardBody className="flex max-h-[70vh] flex-col p-0">
          <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            Hội thoại
            <span className="ml-2 text-xs font-normal text-slate-500">
              {connected ? '· Đã kết nối' : '· Đang kết nối…'}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-sm text-slate-500">Đang tải…</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Chưa có tin nhắn.</div>
            ) : (
              <ul>
                {conversations.map((c) => {
                  const active = String(c.peerId) === peerKey
                  const initial = (c.peerName || 'T').trim().charAt(0).toUpperCase()
                  return (
                    <li key={String(c.peerId)}>
                      <Link
                        to={`/chat/${c.peerId}`}
                        className={`flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--blue-soft)] ${
                          active ? 'bg-[var(--orange-soft)]' : ''
                        }`}
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--blue-soft)] text-sm font-bold text-[var(--fpt-blue)]">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{c.peerName || 'Thành viên'}</div>
                          <div className="truncate text-xs text-slate-500">{c.lastText}</div>
                        </div>
                        <div className="text-[10px] text-slate-400">{shortTime(c.lastAt)}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex max-h-[70vh] flex-col p-0">
          {!peerKey ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-slate-500">
              Chọn một hội thoại hoặc mở chat từ hồ sơ thành viên.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                <button
                  type="button"
                  onClick={() => nav('/chat')}
                  className="rounded-full p-2 hover:bg-[var(--blue-soft)] lg:hidden"
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{activePeerName}</div>
                  <div className="text-[11px] text-emerald-600">{connected ? 'Đang hoạt động' : 'Ngoại tuyến'}</div>
                  <Link
                    to={`/profile/${peerKey}`}
                    className="text-xs font-semibold text-sky-700 hover:underline"
                  >
                    Xem hồ sơ
                  </Link>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {loadingThread ? (
                  <div className="text-sm text-slate-500">Đang tải tin nhắn…</div>
                ) : (
                  messages.map((m) => {
                    const mine = String(m.fromId) === String(me?._id)
                    const reactionSummary = summarizeReactions(m)
                    return (
                      <div
                        key={String(m._id)}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`group max-w-[85%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm ${
                              mine
                                ? 'bg-[var(--fpt-blue)] text-white'
                                : 'bg-[var(--blue-soft)] text-slate-800'
                            }`}
                          >
                            {!mine && (
                              <div className="mb-1 text-[10px] font-semibold uppercase opacity-70">
                                {m.fromName}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap break-words">{m.text}</div>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">{shortTime(m.createdAt)}</div>
                          {reactionSummary.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {reactionSummary.map((r) => (
                                <button
                                  key={`${m._id}-${r.emoji}`}
                                  type="button"
                                  onClick={() => toggleReaction(m._id, r.emoji)}
                                  className={`rounded-full border px-2 py-0.5 text-xs ${
                                    mine ? 'border-white/30 bg-white/20 text-white' : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  {r.emoji} {r.count}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="relative mt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenReactionPickerId((prev) => (prev === m._id ? null : m._id))
                              }
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] opacity-0 transition group-hover:opacity-100 ${
                                mine ? 'hover:bg-white/20' : 'hover:bg-slate-100'
                              }`}
                            >
                              <Smile className="h-3.5 w-3.5" /> Cảm xúc
                            </button>
                            {openReactionPickerId === m._id && (
                              <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg">
                                {DM_REACTIONS.map((emoji) => (
                                  <button
                                    key={`${m._id}-pick-${emoji}`}
                                    type="button"
                                    onClick={() => {
                                      toggleReaction(m._id, emoji)
                                      setOpenReactionPickerId(null)
                                    }}
                                    className="rounded-full px-2 py-1 text-sm transition hover:bg-slate-100"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>
              <form
                className="flex gap-2 border-t border-[var(--border)] p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tin nhắn…"
                  className="input-shell min-w-0 flex-1 rounded-2xl px-4 py-2.5 text-sm"
                  maxLength={5000}
                />
                <button
                  type="submit"
                  disabled={sendBusy || !connected}
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[var(--fpt-orange)] px-4 py-2 text-sm font-bold text-white shadow-soft disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Gửi
                </button>
              </form>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
