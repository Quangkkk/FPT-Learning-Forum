import React, { useEffect, useState } from 'react'
import { RequireRole } from '../lib/auth'
import { Card, CardBody, CardHeader } from '../components/Card'
import Badge from '../components/Badge'

function ModeratorInner() {
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState([])
  const [reports, setReports] = useState([])

  async function refresh() {
    setLoading(true)
    try {
      const postsRes = await fetch("/api/posts")
      const posts = await postsRes.json()

      const reportsRes = await fetch("/api/reports")
      const rep = await reportsRes.json()

      setPending((posts || []).filter((p) => p.status === 'pending'))
      setReports(rep || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function setStatus(postId, status) {
    try {
      await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      await refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft">
        <div className="text-xl font-bold">Moderator Dashboard</div>
        <div className="mt-1 text-sm text-slate-600">
          Duyệt bài & xử lý báo cáo.
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-soft">Đang tải…</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Bài chờ duyệt</div>
                <Badge tone="amber">{pending.length}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              {pending.length === 0 ? (
                <div className="text-sm text-slate-600">
                  Không có bài chờ duyệt.
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((p) => (
                    <div key={p._id} className="rounded-2xl border p-4">
                      <div className="font-semibold">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setStatus(p._id, 'approved')}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setStatus(p._id, 'rejected')}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Báo cáo nội dung</div>
                <Badge tone="red">{reports.length}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              {reports.length === 0 ? (
                <div className="text-sm text-slate-600">
                  Chưa có báo cáo nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r._id} className="rounded-2xl border p-4">
                      <div className="flex justify-between">
                        <div className="font-semibold">
                          {r.targetType} • {r.targetId}
                        </div>
                        <Badge tone="red">{r.status}</Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        Lý do: {r.reason}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

export default function Moderator() {
  return (
    <RequireRole allow={['moderator', 'admin']}>
      <ModeratorInner />
    </RequireRole>
  )
}