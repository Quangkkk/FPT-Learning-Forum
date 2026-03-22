import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'

export default function Category() {
  const { categoryId } = useParams()
  const [forum, setForum] = useState(null)

  useEffect(() => {
    fetch('/api/forum')
      .then((res) => res.json())
      .then((data) => setForum(data))
      .catch((err) => console.error(err))
  }, [])

  if (!forum) return <div className="app-surface rounded-[28px] p-6">Loading...</div>

  const cat = forum?.categories?.find((c) => c.id === categoryId)

  if (!cat) {
    return (
      <div className="app-surface rounded-[28px] p-6">
        <div className="text-lg font-semibold">Không tìm thấy chuyên mục</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="hero-panel bg-grid rounded-[32px] p-6">
        <div className="section-kicker">Category</div>
        <div className="mt-2 text-2xl font-bold">{cat.name}</div>
        <div className="mt-1 text-sm text-slate-600">
          Chọn môn hoặc chủ đề để xem bài viết.
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
                className="rounded-[24px] border border-[var(--border)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(243,112,33,0.22)] hover:bg-[var(--orange-soft)]"
              >
                <div className="font-semibold text-slate-900">
                  {forum?.topics?.[t]?.name || t}
                </div>
                <div className="text-xs text-slate-500">Xem thảo luận</div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
