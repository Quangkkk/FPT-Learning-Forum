import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'
import MarkdownLite from '../components/MarkdownLite'
import { Flag, Send, Smile } from 'lucide-react'
import { useAuth } from '../lib/auth'

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

function normalizePostMedia(post) {
  const sources = Array.isArray(post?.media) ? post.media : []

  return sources
    .map((item, index) => {
      if (!item) return null

      if (typeof item === 'string') {
        const isVideo = item.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)$/i.test(item)
        return {
          kind: isVideo ? 'video' : 'image',
          name: `Tệp đính kèm ${index + 1}`,
          url: item
        }
      }

      const url = item.url || item.src || item.path
      if (!url) return null

      const mimeType = String(item.mimeType || item.type || '')
      const isVideo =
        item.kind === 'video' ||
        mimeType.startsWith('video/') ||
        String(url).startsWith('data:video/') ||
        /\.(mp4|webm|ogg|mov)$/i.test(String(url))

      return {
        kind: isVideo ? 'video' : 'image',
        name: item.name || `Tệp đính kèm ${index + 1}`,
        url
      }
    })
    .filter(Boolean)
}

export default function PostDetail() {
  const { postId } = useParams()
  const nav = useNavigate()
  const { role, auth } = useAuth()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('Spam / quảng cáo')
  const [postPickerOpen, setPostPickerOpen] = useState(false)
  const [openCommentPickerId, setOpenCommentPickerId] = useState(null)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}`)
      const data = await res.json()
      setPost(data.post)
      setComments(data.comments || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [postId])

  if (loading) return <div className="app-surface rounded-[28px] p-6">Đang tải...</div>
  if (!post) return null

  const mediaItems = normalizePostMedia(post)

  async function submitComment(e) {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    if (!auth?.user?._id) return nav('/login')

    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`
        },
        body: JSON.stringify({
          content: text
        })
      })
      setComment('')
      await refresh()
    } catch (err) {
      console.error(err)
    }
  }

  async function submitReport() {
    if (!auth?.user?._id) return nav('/login')

    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`
        },
        body: JSON.stringify({
          targetType: 'post',
          targetId: postId,
          reason
        })
      })
      setReportOpen(false)
      alert('Đã gửi báo cáo.')
    } catch (err) {
      console.error(err)
    }
  }

  function summarizeReactions(item) {
    const list = Array.isArray(item?.reactions) ? item.reactions : []
    const map = new Map()
    for (const r of list) {
      const key = String(r.emoji || '')
      if (!key) continue
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }))
  }

  async function reactComment(commentId, emoji) {
    if (!auth?.token) {
      nav('/login')
      return
    }
    try {
      const res = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ emoji })
      })
      const updated = await res.json()
      if (!res.ok) return
      setComments((prev) =>
        prev.map((c) => (String(c._id) === String(updated._id) ? updated : c))
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function reactPost(emoji) {
    if (!auth?.token) {
      nav('/login')
      return
    }
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ emoji })
      })
      const updated = await res.json()
      if (!res.ok) return
      setPost((prev) => (prev ? { ...prev, reactions: updated.reactions || [] } : prev))
      setPostPickerOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  function reactionButtonClass(active = false) {
    return `rounded-full border px-2 py-0.5 text-xs ${
      active
        ? 'border-[rgba(0,102,179,0.25)] bg-[var(--blue-soft)] text-[var(--fpt-blue)]'
        : 'border-slate-200 bg-white text-slate-700'
    }`
  }

  function relativeTime(value) {
    const t = new Date(value).getTime()
    if (Number.isNaN(t)) return ''
    const diff = Math.floor((Date.now() - t) / 60000)
    if (diff < 1) return 'Vừa xong'
    if (diff < 60) return `${diff} phút`
    const h = Math.floor(diff / 60)
    if (h < 24) return `${h} giờ`
    const d = Math.floor(h / 24)
    return `${d} ngày`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between gap-3">
            <div>
              <div className="section-kicker">Discussion</div>
              <div className="text-lg font-bold">{post.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                {post.isAnonymous
                  ? 'Ẩn danh'
                  : (post.authorId?.email || post.authorId?.name || 'Ẩn danh')} • {new Date(post.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>

            <button
              onClick={() => setReportOpen((v) => !v)}
              className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Flag className="h-4 w-4" />
              Báo cáo
            </button>
          </div>
        </CardHeader>

        <CardBody>
          <MarkdownLite text={post.content} />
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            {summarizeReactions(post).map((r) => (
              <button
                key={`post-${r.emoji}`}
                type="button"
                onClick={() => reactPost(r.emoji)}
                className={reactionButtonClass()}
              >
                {r.emoji} {r.count}
              </button>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPostPickerOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Smile className="h-3.5 w-3.5" />
                Cảm xúc
              </button>
              {postPickerOpen && (
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={`post-pick-${emoji}`}
                      type="button"
                      onClick={() => reactPost(emoji)}
                      className="rounded-full px-2 py-1 text-sm transition hover:bg-slate-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {Array.isArray(post.imageUrls) && post.imageUrls.length > 0 ? (
            <div className="mt-4">
              <div className="text-sm font-semibold">Ảnh đính kèm</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {post.imageUrls.map((url, idx) => (
                  <a key={`post-img-${idx}`} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`post-image-${idx + 1}`} className="h-44 w-full rounded-xl border object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {Array.isArray(post.videoUrls) && post.videoUrls.length > 0 ? (
            <div className="mt-4">
              <div className="text-sm font-semibold">Video đính kèm</div>
              <div className="mt-2 space-y-3">
                {post.videoUrls.map((url, idx) => (
                  <div key={`post-video-${idx}`} className="rounded-xl border p-2">
                    <video src={url} controls className="h-56 w-full rounded-lg bg-black/5" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {reportOpen && (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-[var(--orange-soft)] p-4">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-shell rounded-2xl px-3 py-2 text-sm"
              >
                <option>Spam / quảng cáo</option>
                <option>Nội dung xúc phạm</option>
                <option>Thông tin sai lệch</option>
                <option>Khác</option>
              </select>

              <button
                onClick={submitReport}
                className="ml-2 rounded-full bg-[var(--fpt-orange)] px-4 py-2 text-sm font-semibold text-white"
              >
                Gửi
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Bình luận ({comments.length})</div>
        </CardHeader>

        <CardBody>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Chưa có bình luận. Hãy là người đầu tiên bình luận và thả cảm xúc.
              </div>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="rounded-[20px] border border-[var(--border)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--blue-soft)] text-sm font-bold text-[var(--fpt-blue)]">
                      {(c.authorId?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <div className="text-sm font-semibold">{c.authorId?.name || 'Ẩn danh'}</div>
                        <div className="mt-1 text-sm">{c.content}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <button type="button" className="hover:text-[var(--fpt-blue)]">Thích</button>
                        <button type="button" className="hover:text-[var(--fpt-blue)]">Phản hồi</button>
                        <span>{relativeTime(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 ml-12 flex flex-wrap items-center gap-1">
                    {summarizeReactions(c).map((r) => (
                      <button
                        key={`${c._id}-${r.emoji}`}
                        type="button"
                        onClick={() => reactComment(c._id, r.emoji)}
                        className={reactionButtonClass()}
                      >
                        {r.emoji} {r.count}
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentPickerId((prev) => (prev === c._id ? null : c._id))
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Smile className="h-3.5 w-3.5" />
                        Cảm xúc
                      </button>
                      {openCommentPickerId === c._id && (
                        <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg">
                          {REACTIONS.map((emoji) => (
                            <button
                              key={`${c._id}-pick-${emoji}`}
                              type="button"
                              onClick={() => {
                                reactComment(c._id, emoji)
                                setOpenCommentPickerId(null)
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
              ))
            )}
          </div>

          <form onSubmit={submitComment} className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={
                role === 'guest'
                  ? 'Đăng nhập để bình luận...'
                  : 'Viết bình luận của bạn...'
              }
              className="input-shell w-full rounded-3xl px-3 py-3 text-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
              >
                <Send className="h-4 w-4" />
                Gửi
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
