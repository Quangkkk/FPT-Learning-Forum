import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'
import { useAuth, RequireRole } from '../lib/auth'

function CreatePostInner() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { auth } = useAuth()

  const [forum, setForum] = useState(null)
  const [topicId, setTopicId] = useState(sp.get('topic') || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  // 👇 thêm state ẩn danh
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    fetch("/api/forum")
      .then(res => res.json())
      .then(data => {
        setForum(data)
        if (!topicId && data?.topics) {
          const first = Object.keys(data.topics)[0]
          setTopicId(first)
        }
      })
      .catch(err => console.error(err))
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSaving(true)

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topicId,
          title: title.trim(),
          content: content.trim(),
          authorId: auth.user._id,
          isAnonymous   // 👈 gửi lên backend
        })
      })

      const data = await res.json()
      nav(`/post/${data._id}`)
    } catch (err) {
      console.error(err)
    }

    setSaving(false)
  }

  if (!forum) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="text-lg font-semibold">Đăng bài nhanh</div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">

            {/* Chủ đề */}
            <div>
              <label className="text-sm font-semibold">Chủ đề</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {Object.entries(forum?.topics || {}).map(([id, t]) => (
                  <option key={id} value={id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tiêu đề */}
            <div>
              <label className="text-sm font-semibold">Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            {/* Nội dung */}
            <div>
              <label className="text-sm font-semibold">Nội dung</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            {/* 👇 checkbox ẩn danh */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label className="text-sm">Đăng bài ẩn danh</label>
            </div>

            {/* nút đăng */}
            <div className="flex justify-end">
              <button
                disabled={saving}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? 'Đang đăng…' : 'Đăng bài'}
              </button>
            </div>

          </form>
        </CardBody>
      </Card>
    </div>
  )
}

export default function CreatePost() {
  return (
    <RequireRole allow={['student', 'moderator', 'admin']}>
      <CreatePostInner />
    </RequireRole>
  )
}