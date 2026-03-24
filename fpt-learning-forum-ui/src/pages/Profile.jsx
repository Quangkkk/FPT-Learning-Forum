import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, UserPlus, UserMinus, UserCircle2, ShieldCheck, FileText } from 'lucide-react'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'
import { fetchJson } from '../lib/api'

export default function Profile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user: me, auth, isSignedIn } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr('')
      try {
        const h = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        const [p, list] = await Promise.all([
          fetchJson(`/api/users/${id}/profile`, { headers: h }),
          fetchJson(`/api/users/${id}/posts?limit=20`)
        ])
        if (!cancelled) {
          setProfile(p)
          setPosts(Array.isArray(list) ? list : [])
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Không tải được hồ sơ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) load()
    return () => {
      cancelled = true
    }
  }, [id, auth?.token])

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
      setErr(e.message || 'Thao tác thất bại')
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Đang tải hồ sơ…</div>
  }

  if (err || !profile) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="font-semibold text-rose-700">{err || 'Không tìm thấy người dùng'}</div>
        <Link to="/members" className="mt-3 inline-block text-sm font-semibold text-sky-700">
          ← Danh sách thành viên
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-[rgba(0,102,179,0.14)] bg-[linear-gradient(135deg,var(--blue-soft),white)] p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="rounded-3xl bg-[rgba(0,102,179,0.1)] p-4">
              <UserCircle2 className="h-12 w-12 text-[var(--fpt-blue)]" />
            </div>
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
                    <UserMinus className="h-4 w-4" /> Bỏ theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Theo dõi
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
                Nhắn tin
              </button>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Người theo dõi</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{profile.followerCount}</div>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đang theo dõi</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{profile.followingCount}</div>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bài viết</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{profile.postCount}</div>
          </div>
        </div>
        <Link to="/members" className="mt-4 inline-block text-sm font-semibold text-sky-700">
          ← Thành viên
        </Link>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-[var(--fpt-blue)]" />
            Bài viết gần đây
          </div>
          {posts.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500">Chưa có bài viết.</div>
          ) : (
            <ul className="mt-3 space-y-2">
              {posts.map((post) => (
                <li key={post._id}>
                  <Link
                    to={`/post/${post._id}`}
                    className="block rounded-2xl border border-transparent px-3 py-3 text-sm font-medium transition hover:border-[rgba(0,102,179,0.12)] hover:bg-[var(--blue-soft)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{post.title || '(Không tiêu đề)'}</span>
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
