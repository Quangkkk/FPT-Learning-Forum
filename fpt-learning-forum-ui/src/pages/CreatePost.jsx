import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'
import { useAuth, RequireRole } from '../lib/auth'
import { X } from 'lucide-react'

function CreatePostInner() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { auth } = useAuth()

  const [forum, setForum] = useState(null)
  const [topicId, setTopicId] = useState(sp.get('topic') || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])

  // 👇 thêm state ẩn danh
  const [isAnonymous, setIsAnonymous] = useState(false)

  const imagePreviews = useMemo(
    () => images.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [images]
  )

  const videoPreviews = useMemo(
    () => videos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [videos]
  )

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
      videoPreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [imagePreviews, videoPreviews])

  function removeImageAt(index) {
    setImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  function removeVideoAt(index) {
    setVideos((prev) => prev.filter((_, idx) => idx !== index))
  }

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
      const payload = new FormData()
      payload.append('topicId', topicId)
      payload.append('title', title.trim())
      payload.append('content', content.trim())
      payload.append('isAnonymous', String(isAnonymous))
      images.forEach((file) => payload.append('image', file))
      videos.forEach((file) => payload.append('video', file))

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth?.token}`
        },
        body: payload
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Đăng bài thất bại')
      }
      nav(`/post/${data._id}`)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Đăng bài thất bại')
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

            <div>
              <label className="text-sm font-semibold">Ảnh đính kèm (nhiều ảnh)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <div className="mt-1 text-xs text-slate-500">
                {images.length ? `${images.length} ảnh đã chọn` : 'Chưa chọn ảnh'}
              </div>
              {imagePreviews.length > 0 ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {imagePreviews.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="relative rounded-xl border p-1">
                      <img src={item.url} alt={item.name} className="h-24 w-full rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImageAt(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        aria-label="Xóa ảnh"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-semibold">Video đính kèm (nhiều video)</label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => setVideos(Array.from(e.target.files || []))}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <div className="mt-1 text-xs text-slate-500">
                {videos.length ? `${videos.length} video đã chọn` : 'Chưa chọn video'}
              </div>
              {videoPreviews.length > 0 ? (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {videoPreviews.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="relative rounded-xl border p-2">
                      <video src={item.url} controls className="h-36 w-full rounded-lg bg-black/5" />
                      <div className="mt-1 truncate text-xs text-slate-500">{item.name}</div>
                      <button
                        type="button"
                        onClick={() => removeVideoAt(idx)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        aria-label="Xóa video"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
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