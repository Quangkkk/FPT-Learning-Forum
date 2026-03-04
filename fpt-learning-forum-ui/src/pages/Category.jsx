import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'

export default function Category() {
  const { categoryId } = useParams()
  const [forum, setForum] = useState(null)

  useEffect(() => {
    fetch("/api/forum")
      .then(res => res.json())
      .then(data => setForum(data))
      .catch(err => console.error(err))
  }, [])

  if (!forum) return <div className="p-6">Loading...</div>

  const cat = forum?.categories?.find((c) => c.id === categoryId)

  if (!cat) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="text-lg font-semibold">Không tìm thấy chuyên mục</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-grid rounded-2xl border bg-white p-6 shadow-soft">
        <div className="text-2xl font-bold">{cat.name}</div>
        <div className="mt-1 text-sm text-slate-600">
          Chọn môn / chủ đề để xem bài viết.
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Chủ đề</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-2">
            {(cat.topics || []).map((t) => (
              <Link
                key={t}
                to={`/topic/${t}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
              >
                <div className="font-semibold text-slate-900">
                  {forum?.topics?.[t]?.name || t}
                </div>
                <div className="text-xs text-slate-500">
                  Xem thảo luận
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}