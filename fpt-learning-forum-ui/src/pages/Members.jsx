import React, { useEffect, useState } from 'react'
import { Card, CardBody } from '../components/Card'

export default function Members() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold">Thành viên</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Card key={u._id || u.id}>
            <CardBody className="flex items-center gap-3">
              <img
                src={u.avatar || "https://i.pravatar.cc/150"}
                alt=""
                className="h-12 w-12 rounded-2xl"
              />
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-slate-500">{u.role}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}