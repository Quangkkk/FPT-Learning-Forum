import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  MessageCircle,
  UserPlus,
  UserMinus,
  UserCircle2,
  ShieldCheck,
  FileText,
  PencilLine
} from 'lucide-react'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'
import { fetchJson } from '../lib/api'

export default function Profile() {
  const { id } = useParams()
  const nav = useNavigate()
  const {
    user: me,
    auth,
    isSignedIn,
    updateAuthUser = () => {}
  } = useAuth()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [followBusy, setFollowBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErr('')
      try {
        const headers = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        const [p, list] = await Promise.all([
          fetchJson(`/api/users/${id}/profile`, { headers }),
          fetchJson(`/api/users/${id}/posts?limit=20`)
        ])

        if (!cancelled) {
          setProfile(p)
          setPosts(Array.isArray(list) ? list : [])
          setForm({
            name: p?.name || '',
            email: p?.email || '',
            password: ''
          })
          setAvatarFile(null)
          setAvatarPreview('')
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message || 'Khong tai duoc ho so')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (id) load()
    return () => {
      cancelled = true
    }
  }, [id, auth?.token])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const isSelf = me && id && String(me._id) === String(id)
  const canFollow = isSignedIn && !isSelf && profile

  async function toggleFollow() {
    if (!canFollow || followBusy) return
    setFollowBusy(true)
    try {
      const path = profile.isFollowing ? '/api/unfollow' : '/api/follow'
      const next = await fetchJson(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ userId: id })
      })

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: next.isFollowing,
              followerCount: next.followerCount ?? prev.followerCount
            }
          : prev
      )
    } catch (e) {
      setErr(e.message || 'Thao tac that bai')
    } finally {
      setFollowBusy(false)
    }
  }

  function startEditProfile() {
    setForm({
      name: profile?.name || '',
      email: profile?.email || me?.email || '',
      password: ''
    })
    setErr('')
    setAvatarFile(null)
    setAvatarPreview('')
    setEditing(true)
  }

  function cancelEditProfile() {
    setEditing(false)
    setForm({
      name: profile?.name || '',
      email: profile?.email || me?.email || '',
      password: ''
    })
    setAvatarFile(null)
    setAvatarPreview('')
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) {
      setAvatarFile(null)
      setAvatarPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setErr('Chi ho tro file anh cho avatar')
      e.target.value = ''
      return
    }

    setErr('')
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!auth?.token) return

    setSavingProfile(true)
    setErr('')
    try {
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        const avatarRes = await fetch(`/api/users/${id}/avatar`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${auth.token}`
          },
          body: formData
        })

        const avatarText = await avatarRes.text()
        let avatarData = null
        try {
          avatarData = avatarText ? JSON.parse(avatarText) : null
        } catch {
          avatarData = null
        }

        if (!avatarRes.ok) {
          throw new Error(avatarData?.message || 'Khong the cap nhat avatar')
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                avatar: avatarData.user.avatar
              }
            : prev
        )
        updateAuthUser(avatarData.user)
      }

      const data = await fetchJson(`/api/users/${id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      })

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: data.user.name,
              email: data.user.email,
              avatar: data.user.avatar || prev.avatar
            }
          : prev
      )
      updateAuthUser(data.user)
      setForm((prev) => ({ ...prev, password: '' }))
      setAvatarFile(null)
      setAvatarPreview('')
      setEditing(false)
    } catch (e) {
      setErr(e.message || 'Khong the cap nhat ho so')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Dang tai ho so...</div>
  }

  if (err && !profile) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="font-semibold text-rose-700">{err || 'Khong tim thay nguoi dung'}</div>
        <Link to="/members" className="mt-3 inline-block text-sm font-semibold text-sky-700">
          ← Danh sach thanh vien
        </Link>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-[rgba(0,102,179,0.14)] bg-[linear-gradient(135deg,var(--blue-soft),white)] p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-20 w-20 rounded-3xl object-cover shadow-soft"
              />
            ) : (
              <div className="rounded-3xl bg-[rgba(0,102,179,0.1)] p-4">
                <UserCircle2 className="h-12 w-12 text-[var(--fpt-blue)]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="section-kicker">Profile</div>
              <div className="truncate text-2xl font-bold text-slate-900">{profile.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--fpt-green)]" />
                  {profile.role}
                </span>
                {profile.email && <span className="truncate">{profile.email}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isSelf && (
              <button
                type="button"
                onClick={startEditProfile}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,102,179,0.2)] bg-white px-4 py-2 text-sm font-semibold text-[var(--fpt-blue)]"
              >
                <PencilLine className="h-4 w-4" />
                Sua ho so
              </button>
            )}

            {canFollow && (
              <button
                type="button"
                disabled={followBusy}
                onClick={toggleFollow}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-soft transition disabled:opacity-60 ${
                  profile.isFollowing
                    ? 'bg-slate-500 hover:bg-slate-600'
                    : 'bg-[var(--fpt-blue)] hover:opacity-95'
                }`}
              >
                {profile.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" /> Bo theo doi
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Theo doi
                  </>
                )}
              </button>
            )}

            {isSignedIn && !isSelf && (
              <button
                type="button"
                onClick={() => nav(`/chat/${id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,102,179,0.2)] bg-[var(--blue-soft)] px-4 py-2 text-sm font-semibold text-[var(--fpt-blue)] hover:bg-white"
              >
                <MessageCircle className="h-4 w-4" />
                Nhan tin
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nguoi theo doi</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{profile.followerCount}</div>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dang theo doi</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{profile.followingCount}</div>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bai viet</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{profile.postCount}</div>
          </div>
        </div>

        {editing && (
          <form onSubmit={saveProfile} className="mt-5 rounded-3xl border border-[var(--border)] bg-white/90 p-5">
            <div className="text-sm font-semibold text-slate-900">Cap nhat ho so</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Anh dai dien</label>
                <div className="mt-2 flex items-center gap-4">
                  {avatarPreview || profile.avatar ? (
                    <img
                      src={avatarPreview || profile.avatar}
                      alt="avatar-preview"
                      className="h-20 w-20 rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                      <UserCircle2 className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--blue-soft)] file:px-4 file:py-2 file:font-semibold file:text-[var(--fpt-blue)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Ten hien thi</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-shell mt-1 w-full rounded-2xl px-3 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="input-shell mt-1 w-full rounded-2xl px-3 py-3 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Mat khau moi</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Bo trong neu khong doi mat khau"
                  className="input-shell mt-1 w-full rounded-2xl px-3 py-3 text-sm"
                />
              </div>
            </div>

            {err && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelEditProfile}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Huy
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary rounded-full px-5 py-2 text-sm font-bold disabled:opacity-60"
              >
                {savingProfile ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </div>
          </form>
        )}

        <Link to="/members" className="mt-4 inline-block text-sm font-semibold text-sky-700">
          ← Thanh vien
        </Link>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-[var(--fpt-blue)]" />
            Bai viet gan day
          </div>
          {posts.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500">Chua co bai viet.</div>
          ) : (
            <ul className="mt-3 space-y-2">
              {posts.map((post) => (
                <li key={post._id}>
                  <Link
                    to={`/post/${post._id}`}
                    className="block rounded-2xl border border-transparent px-3 py-3 text-sm font-medium transition hover:border-[rgba(0,102,179,0.12)] hover:bg-[var(--blue-soft)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{post.title || '(Khong tieu de)'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                        {post.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
