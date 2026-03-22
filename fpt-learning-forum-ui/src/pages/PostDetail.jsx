import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'
import Badge from '../components/Badge'
import MarkdownLite from '../components/MarkdownLite'
import { Flag, Send } from 'lucide-react'
import { useAuth } from '../lib/auth'

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

  if (loading)
    return <div className="rounded-2xl bg-white p-6 shadow-soft">Đang tải…</div>

  if (!post) return null

  async function submitComment(e) {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    if (!auth?.user?._id) return nav('/login')

    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "post",
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
              <div className="text-lg font-bold">{post.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                {post.isAnonymous
                  ? "Ẩn danh"
                  : (post.authorId?.email || post.authorId?.name || "Ẩn danh")
                } • {new Date(post.createdAt).toLocaleString("vi-VN")}
              </div>
            </div>

            <button
              onClick={() => setReportOpen(v => !v)}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
            >
              <Flag className="h-4 w-4" />
              Báo cáo
            </button>
          </div>
        </CardHeader>

        <CardBody>
          <MarkdownLite text={post.content} />

          {reportOpen && (
            <div className="mt-4 rounded-2xl border bg-amber-50 p-4">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                <option>Spam / quảng cáo</option>
                <option>Nội dung xúc phạm</option>
                <option>Thông tin sai lệch</option>
                <option>Khác</option>
              </select>

              <button
                onClick={submitReport}
                className="ml-2 rounded-xl bg-amber-600 px-4 py-2 text-sm text-white"
              >
                Gửi
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">
            Bình luận ({comments.length})
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c._id} className="rounded-2xl border p-4">
                <div className="text-sm font-semibold">
                  {c.author?.name || 'Ẩn danh'}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="mt-2 text-sm">{c.content}</div>
              </div>
            ))}
          </div>

          <form onSubmit={submitComment} className="mt-4 border p-4 rounded-2xl">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={
                role === 'guest'
                  ? 'Đăng nhập để bình luận…'
                  : 'Viết bình luận của bạn…'
              }
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm text-white"
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