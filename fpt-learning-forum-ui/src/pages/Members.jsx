import React, { useEffect, useState } from 'react'
import { Card, CardBody } from '../components/Card'
import { loadAuth } from '../lib/storage'
import { useAuth } from '../lib/auth'

export default function Members() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { role } = useAuth()

  const auth = loadAuth()

  // 🔥 load users (có token)
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${auth?.token}`
        }
      })

      const data = await res.json()
      setUsers(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 🔥 toggle active
  const toggleUser = async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth?.token}`
        }
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message)
        return
      }

      // reload lại list
      fetchUsers()

    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold">Thành viên</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Card key={u._id || u.id}>
            <CardBody className="flex items-center justify-between gap-3">

              {/* LEFT */}
              <div className="flex items-center gap-3">
                <img
                  src={u.avatar || "https://i.pravatar.cc/150"}
                  alt=""
                  className="h-12 w-12 rounded-2xl"
                />
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-slate-500">
                    {u.role} • {u.active ? "Active" : "Locked"}
                  </div>
                </div>
              </div>

              {/* RIGHT - chỉ admin thấy */}
              {role === "admin" && (
                <button
                  onClick={() => toggleUser(u._id)}
                  className={`px-3 py-1 rounded-xl text-sm ${u.active
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                    }`}
                >
                  {u.active ? "Deactivate" : "Activate"}
                </button>
              )}

            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
