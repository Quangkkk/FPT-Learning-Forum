import React from 'react'
import { RequireRole } from '../lib/auth'
import { Card, CardBody, CardHeader } from '../components/Card'
import Badge from '../components/Badge'


function pct(v) {
  const n = Number(v) || 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function AdminInner() {
  const [stats, setStats] = React.useState(null)

  React.useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err))
  }, [])

  if (!stats) {
    return <div className="p-6">Đang tải thống kê…</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-soft">
        <div className="text-2xl font-bold">Admin Dashboard</div>
        <div className="mt-1 text-sm text-white/80">
          Quản lý hệ thống diễn đàn FPT University
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Tổng người dùng</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {stats.users}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Tổng bài viết</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {stats.posts}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Bài chờ duyệt</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">
            {stats.pending}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Report</div>
          <div className="mt-2 text-3xl font-extrabold text-rose-600">
            {stats.reports}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold mb-3">Thao tác nhanh</div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = "/moderator"}
            className="rounded-xl bg-sky-600 px-4 py-2 text-white font-semibold hover:bg-sky-700"
          >
            Duyệt bài
          </button>

          <button
            onClick={() => window.location.href = "/reports"}
            className="rounded-xl bg-rose-600 px-4 py-2 text-white font-semibold hover:bg-rose-700"
          >
            Xem Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  return (
    <RequireRole allow={['admin']}>
      <AdminInner />
    </RequireRole>
  )
}
