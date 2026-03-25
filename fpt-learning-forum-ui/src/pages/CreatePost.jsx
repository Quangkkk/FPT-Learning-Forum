import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'
import { useAuth, RequireRole } from '../lib/auth'
import { fetchJson } from '../lib/api'

const MAX_FILES = 4
const MAX_FILE_SIZE = 15 * 1024 * 1024

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
  const [mediaFiles, setMediaFiles] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJson('/api/forum')
      .then((data) => {
        setForum(data)
        if (data?.topics) {
          const first = Object.keys(data.topics)[0]
          setTopicId((current) => current || first)
        }
      })
      .catch((err) => {
        console.error(err)
        setError(err?.message || 'Khong the tai danh sach chu de.')
      })
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('Vui long nhap tieu de va noi dung bai viet.')
      return
    }

    if (!auth?.token) {
      setError('Phien dang nhap da het han. Vui long dang nhap lai.')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('topicId', topicId)
      formData.append('title', title.trim())
      formData.append('content', content.trim())
      formData.append('isAnonymous', String(isAnonymous))

      mediaFiles.forEach((file) => {
        const fieldName = file.type.startsWith('video/') ? 'video' : 'image'
        formData.append(fieldName, file)
      })

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`
        },
        body: formData
      })

      const text = await res.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(data?.message || 'Dang bai that bai')
      }

      nav(`/post/${data._id}`)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Dang bai that bai')
    } finally {
      setSaving(false)
    }
  }

  function handleFilesChange(e) {
    const nextFiles = Array.from(e.target.files || [])
    const validFiles = nextFiles.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    if (validFiles.length !== nextFiles.length) {
      setError('Chi ho tro file anh hoac video.')
      e.target.value = ''
      return
    }

    const oversized = validFiles.find((file) => file.size > MAX_FILE_SIZE)
    if (oversized) {
      setError(`File ${oversized.name} vuot qua 15MB.`)
      e.target.value = ''
      return
    }

    const merged = [...mediaFiles, ...validFiles].slice(0, MAX_FILES)
    setMediaFiles(merged)
    setError(
      mediaFiles.length + validFiles.length > MAX_FILES
        ? `Chi co the dinh kem toi da ${MAX_FILES} file.`
        : ''
    )

    e.target.value = ''
  }

  function removeFile(index) {
    setMediaFiles((current) => current.filter((_, idx) => idx !== index))
  }

  if (!forum) return <div className="app-surface rounded-[28px] p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="section-kicker">Create</div>
          <div className="mt-1 text-lg font-semibold">Dang bai nhanh</div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Chu de</label>
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
              <label className="text-sm font-semibold">Tieu de</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-shell mt-1 w-full rounded-2xl px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Noi dung</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="input-shell mt-1 w-full rounded-3xl px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Anh / Video dinh kem</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFilesChange}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--blue-soft)] file:px-4 file:py-2 file:font-semibold file:text-[var(--fpt-blue)]"
              />
              <div className="mt-1 text-xs text-slate-500">
                Ho tro toi da 4 file, moi file khong qua 15MB.
              </div>

              {mediaFiles.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {mediaFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {file.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {file.type.startsWith('video/') ? 'Video' : 'Anh'} •{' '}
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label className="text-sm">Dang bai an danh</label>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                disabled={saving}
                className="btn-primary rounded-full px-5 py-3 text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Dang dang...' : 'Dang bai'}
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
