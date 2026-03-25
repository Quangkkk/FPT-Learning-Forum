import React from 'react'
import { useNavigate } from 'react-router-dom'

function AdminInner() {
  const navigate = useNavigate()

  const [stats, setStats] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  const auth = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("lf_auth_v1")) || null
    } catch {
      return null
    }
  }, [])

  if (!auth?.token) {
    return <div className="p-6 text-red-600">Bạn chưa đăng nhập</div>
  }
  if (auth.user.role !== 'admin') {
    return <div className="p-6 text-red-600">Bạn không có quyền truy cập</div>
  }

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${auth.token}` }
        })

        if (!res.ok) throw new Error("Lấy thống kê thất bại")

        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [auth.token])

  if (loading) return <div className="p-6">Đang tải dữ liệu…</div>
  if (error) return <div className="p-6 text-red-600">Lỗi: {error}</div>
  if (!stats) return <div className="p-6">Không có dữ liệu thống kê</div>

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-soft">
        <div className="text-2xl font-bold">Admin Dashboard</div>
        <div className="mt-1 text-sm text-white/80">
          Quản lý hệ thống diễn đàn FPT University
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Tổng người dùng</div>
          <div className="mt-2 text-3xl font-extrabold">{stats.users}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Tổng bài viết</div>
          <div className="mt-2 text-3xl font-extrabold">{stats.posts}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Bài chờ duyệt</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">{stats.pending}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Report</div>
          <div className="mt-2 text-3xl font-extrabold text-rose-600">{stats.reports}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold mb-4">Quản lý hệ thống</div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/admin/topics")}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Quản lý chủ đề
          </button>

          {/* Sau này thêm */}
          <button
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Quản lý Categories
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminInner
