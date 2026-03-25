import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, UserPlus, UserMinus } from 'lucide-react'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'
import { fetchJson } from '../lib/api'

export default function Members() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { role, auth, user } = useAuth()
  const [followBusyId, setFollowBusyId] = useState(null)
  const [roleDrafts, setRoleDrafts] = useState({})
  const [roleBusyId, setRoleBusyId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchJson('/api/users', {
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
      })
      const nextUsers = Array.isArray(data) ? data : []
      setUsers(nextUsers)
      setRoleDrafts((prev) => {
        const next = {}
        nextUsers.forEach((u) => {
          const id = String(u._id)
          next[id] = prev[id] || u.role || 'student'
        })
        return next
      })
    } catch (err) {
      console.error(err)
      setUsers([])
      setRoleDrafts({})
    } finally {
      setLoading(false)
    }
  }, [auth?.token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function toggleUser(id) {
    try {
      await fetchJson(`/api/admin/users/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${auth?.token}`
        }
      })
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Lỗi')
    }
  }

  async function toggleFollow(targetId, currentlyFollowing) {
    if (!auth?.token || followBusyId) return
    setFollowBusyId(targetId)
    try {
      const path = currentlyFollowing ? '/api/unfollow' : '/api/follow'
      const next = await fetchJson(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ userId: targetId })
      })
      setUsers((prev) =>
        prev.map((u) =>
          String(u._id) === String(targetId)
            ? {
                ...u,
                isFollowing: next.isFollowing,
                followerCount: next.followerCount ?? u.followerCount
              }
            : String(u._id) === String(user?._id)
              ? {
                  ...u,
                  followingCount: next.viewerFollowingCount ?? u.followingCount
                }
              : u
        )
      )
    } catch (err) {
      alert(err.message || 'Thao tác thất bại')
    } finally {
      setFollowBusyId(null)
    }
  }

  async function updateUserRole(targetId) {
    if (!auth?.token || roleBusyId) return
    setRoleBusyId(String(targetId))
    try {
      await fetchJson(`/api/admin/users/${targetId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          role: roleDrafts[String(targetId)]
        })
      })
      await fetchUsers()
      alert('Đổi role thành công')
    } catch (err) {
      alert(err.message || 'Không thể đổi role')
    } finally {
      setRoleBusyId(null)
    }
  }

  if (loading) return <div className="p-6">Đang tải…</div>

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold">Thành viên</div>
        <div className="mt-1 text-sm text-slate-600">Theo dõi, xem hồ sơ và nhắn tin.</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const self = user && String(user._id) === String(u._id)
          return (
            <Card key={u._id || u.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/profile/${u._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <img
                      src={u.avatar || 'https://i.pravatar.cc/150'}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-2xl"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold hover:text-[var(--fpt-blue)]">{u.name}</div>
                      <div className="text-xs text-slate-500">
                        {u.role} · {u.followerCount ?? 0} followers · {u.followingCount ?? 0} following
                      </div>
                      <div className="text-xs text-slate-500">{u.active ? 'Hoạt động' : 'Đã khóa'}</div>
                    </div>
                  </Link>
                  {role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => toggleUser(u._id)}
                      className={`shrink-0 rounded-xl px-3 py-1 text-sm ${
                        u.active ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {u.active ? 'Khóa' : 'Mở'}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={roleDrafts[String(u._id)] || u.role}
                        onChange={(e) =>
                          setRoleDrafts((prev) => ({
                            ...prev,
                            [String(u._id)]: e.target.value
                          }))
                        }
                        className="rounded-xl border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="student">student</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        type="button"
                        disabled={
                          roleBusyId === String(u._id) ||
                          roleDrafts[String(u._id)] === u.role ||
                          String(user?._id) === String(u._id)
                        }
                        onClick={() => updateUserRole(u._id)}
                        className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {roleBusyId === String(u._id) ? 'Đang đổi...' : 'Đổi role'}
                      </button>
                    </div>
                  )}
                  {auth?.token && !self && (
                    <>
                      <button
                        type="button"
                        disabled={followBusyId === String(u._id)}
                        onClick={() => toggleFollow(u._id, u.isFollowing)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${
                          u.isFollowing ? 'bg-slate-500' : 'bg-[var(--fpt-blue)]'
                        }`}
                      >
                        {u.isFollowing ? (
                          <>
                            <UserMinus className="h-3.5 w-3.5" /> Bỏ theo dõi
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" /> Theo dõi
                          </>
                        )}
                      </button>
                      <Link
                        to={`/chat/${u._id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[rgba(0,102,179,0.2)] bg-[var(--blue-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--fpt-blue)]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Chat
                      </Link>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
