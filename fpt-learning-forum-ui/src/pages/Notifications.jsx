import React, { useEffect, useMemo, useState } from 'react'
import { Bell, BellDot, CheckCircle2, MessageCircle, UserPlus } from 'lucide-react'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'
import { fetchJson } from '../lib/api'

export default function Notifications() {
  const { auth } = useAuth()
  const [items, setItems] = useState([])
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJson('/api/notifications', {
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        })
        const list = Array.isArray(data) ? data : []
        if (!cancelled) {
          setItems(
            list.map((n) => ({
              _id: n._id || `${n.title || 'n'}-${n.createdAt || Date.now()}`,
              title: n.title || 'Thông báo',
              desc: n.desc || n.message || '',
              type: n.type || 'system',
              read: Boolean(n.read),
              createdAt: n.createdAt || new Date().toISOString()
            }))
          )
        }
      } catch (err) {
        if (!cancelled) {
          setItems([])
          setError(err.message || 'Không tải được thông báo')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [auth?.token])

  const unreadCount = useMemo(() => items.filter((x) => !x.read).length, [items])
  const visibleItems = useMemo(
    () => (onlyUnread ? items.filter((x) => !x.read) : items),
    [items, onlyUnread]
  )

  function iconByType(type) {
    if (type === 'follow') return <UserPlus className="h-4 w-4 text-[var(--fpt-blue)]" />
    if (type === 'message') return <MessageCircle className="h-4 w-4 text-[var(--fpt-orange)]" />
    return <Bell className="h-4 w-4 text-[var(--fpt-green)]" />
  }

  function formatTime(value) {
    const t = new Date(value).getTime()
    if (Number.isNaN(t)) return 'Vừa xong'
    const diff = Math.max(0, Date.now() - t)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Vừa xong'
    if (m < 60) return `${m} phút trước`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ trước`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d} ngày trước`
    return new Date(value).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return <div className="p-6">Đang tải…</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-[rgba(0,102,179,0.12)] bg-[linear-gradient(135deg,var(--blue-soft),white)] p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="section-kicker">Inbox</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">Thông báo</div>
            <div className="mt-1 text-sm text-slate-600">
              Bạn có <span className="font-semibold text-slate-900">{unreadCount}</span> thông báo chưa đọc.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyUnread((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              onlyUnread
                ? 'border-[rgba(0,102,179,0.2)] bg-white text-[var(--fpt-blue)]'
                : 'border-transparent bg-[rgba(0,102,179,0.08)] text-slate-700 hover:bg-white'
            }`}
          >
            {onlyUnread ? <BellDot className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {onlyUnread ? 'Đang lọc chưa đọc' : 'Hiển thị tất cả'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="text-sm text-slate-500">
            {onlyUnread ? 'Bạn không còn thông báo chưa đọc.' : 'Không có thông báo nào.'}
          </div>
        </div>
      ) : (
        visibleItems.map((n) => (
          <Card key={n._id}>
            <CardBody className="flex items-start gap-3">
              <div className="mt-1 rounded-xl bg-[var(--blue-soft)] p-2">{iconByType(n.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  {!n.read && (
                    <span className="rounded-full bg-[rgba(243,112,33,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--fpt-orange)]">
                      Mới
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-slate-600">{n.desc || 'Không có nội dung chi tiết.'}</div>
                <div className="mt-2 text-xs text-slate-400">{formatTime(n.createdAt)}</div>
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  )
}