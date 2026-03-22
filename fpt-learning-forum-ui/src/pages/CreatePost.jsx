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
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    fetch('/api/forum')
      .then((res) => res.json())
      .then((data) => {
        setForum(data)
        if (!topicId && data?.topics) {
          const first = Object.keys(data.topics)[0]
          setTopicId(first)
        }
      })
      .catch((err) => console.error(err))
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSaving(true)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicId,
          title: title.trim(),
          content: content.trim(),
          authorId: auth.user._id,
          isAnonymous
        })
      })

      const data = await res.json()
      nav(`/post/${data._id}`)
    } catch (err) {
      console.error(err)
    }

    setSaving(false)
  }

  if (!forum) return <div className="app-surface rounded-[28px] p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="section-kicker">Create</div>
          <div className="mt-1 text-lg font-semibold">Đăng bài nhanh</div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Chủ đề</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="input-shell mt-1 w-full rounded-2xl px-3 py-3 text-sm"
              >
                {Object.entries(forum?.topics || {}).map(([id, t]) => (
                  <option key={id} value={id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-shell mt-1 w-full rounded-2xl px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Nội dung</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="input-shell mt-1 w-full rounded-3xl px-3 py-3 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label className="text-sm">Đăng bài ẩn danh</label>
            </div>

            <div className="flex justify-end">
              <button
                disabled={saving}
                className="btn-primary rounded-full px-5 py-3 text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Đang đăng...' : 'Đăng bài'}
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
