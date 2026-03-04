import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'

export default function Home() {
  const [forum, setForum] = useState({ categories: [], topics: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/forum")
      .then(res => res.json())
      .then(data => {
        setForum({
          categories: data?.categories || [],
          topics: data?.topics || {}
        })
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
      <div className="bg-grid rounded-2xl border bg-white p-6 shadow-soft">
        <div className="text-2xl font-bold text-slate-900">
          Learning Forum • FPT University
        </div>
        <div className="mt-2 max-w-2xl text-sm text-slate-600">
          Nơi hỏi – đáp theo môn học, chia sẻ tài liệu, và kết nối sinh viên với mentor/giảng viên.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/new"
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Xem bài viết mới
          </Link>
          <Link
            to="/create"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Đăng bài nhanh
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {forum.categories.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{c.name}</div>
                <Link
                  to={`/c/${c.id}`}
                  className="text-sm font-semibold text-sky-700 hover:underline"
                >
                  Mở
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {(c.topics || []).map((t) => (
                  <Link
                    key={t}
                    to={`/topic/${t}`}
                    className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {forum.topics[t]?.name || t}
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}