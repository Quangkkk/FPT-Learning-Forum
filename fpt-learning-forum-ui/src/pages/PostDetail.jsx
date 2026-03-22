import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'
import MarkdownLite from '../components/MarkdownLite'
import { Flag, Send } from 'lucide-react'
import { useAuth } from '../lib/auth'

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          authorId: auth.user._id
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
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'post',
          targetId: postId,
          reason,
          reporterId: auth.user._id
        })
      })
      setReportOpen(false)
      alert('Đã gửi báo cáo.')
    } catch (err) {
      console.error(err)
    }
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

          {mediaItems.length > 0 && (
            <div className="mt-5 grid gap-4">
              {mediaItems.map((item, index) => (
                <div key={`${item.url}-${index}`} className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg)]">
                  {item.kind === 'video' ? (
                    <video
                      controls
                      className="max-h-[420px] w-full bg-black"
                      src={item.url}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name || `media-${index + 1}`}
                      className="max-h-[520px] w-full object-cover"
                    />
                  )}
                  <div className="px-4 py-3 text-sm text-slate-600">
                    {item.name || `Tệp đính kèm ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}

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
            {comments.map((c) => (
              <div key={c._id} className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                <div className="text-sm font-semibold">{c.author?.name || 'Ẩn danh'}</div>
                <div className="text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="mt-2 text-sm">{c.content}</div>
              </div>
            ))}
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
