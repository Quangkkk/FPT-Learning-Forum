import React, { useEffect, useState } from 'react'
import { Card, CardBody } from '../components/Card'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notifications")
      .then(res => res.json())
      .then(data => {
        setItems(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-6">Đang tải…</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold">Thông báo</div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          Không có thông báo nào.
        </div>
      ) : (
        items.map((n) => (
          <Card key={n._id}>
            <CardBody>
              <div className="font-semibold">{n.title}</div>
              <div className="mt-1 text-sm text-slate-600">{n.desc}</div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  )
}