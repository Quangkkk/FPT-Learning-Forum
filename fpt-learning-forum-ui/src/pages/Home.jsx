import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../components/Card'

export default function Home() {
  const [forum, setForum] = useState({ categories: [], topics: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/forum')
      .then((res) => res.json())
      .then((data) => {
        setForum({
          categories: data?.categories || [],
          topics: data?.topics || {}
        })
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="app-surface rounded-[28px] p-6">Loading...</div>

  return (
    <div className="space-y-5">
      <div className="hero-panel bg-grid overflow-hidden rounded-[32px] p-7 md:p-8">
        <div className="section-kicker">Student Blog System</div>
        <div className="mt-3 max-w-3xl text-3xl font-bold text-slate-900 md:text-4xl">
          Learning Forum cho sinh viên FPT với màu sắc trẻ, công nghệ và dễ kết nối.
        </div>
        <div className="mt-2 max-w-2xl text-sm text-slate-600">
          Nơi hỏi đáp theo môn học, chia sẻ tài liệu và kết nối sinh viên với mentor hoặc giảng viên.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/new"
            className="btn-primary rounded-full px-5 py-3 text-sm font-bold"
          >
            Xem bài viết mới
          </Link>
          <Link
            to="/create"
            className="btn-ghost rounded-full px-5 py-3 text-sm font-bold"
          >
            Đăng bài nhanh
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/60 bg-white/70 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--fpt-orange)]">Primary</div>
            <div className="mt-1 text-sm font-semibold">FPT Orange cho CTA</div>
          </div>
          <div className="rounded-[24px] border border-white/60 bg-white/70 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--fpt-blue)]">Secondary</div>
            <div className="mt-1 text-sm font-semibold">FPT Blue cho điều hướng</div>
          </div>
          <div className="rounded-[24px] border border-white/60 bg-white/70 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--fpt-green)]">Accent</div>
            <div className="mt-1 text-sm font-semibold">FPT Green cho trạng thái tích cực</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {forum.categories.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="section-kicker">Category</div>
                  <div className="mt-1 text-base font-semibold">{c.name}</div>
                </div>
                <Link
                  to={`/c/${c.id}`}
                  className="rounded-full bg-[var(--blue-soft)] px-4 py-2 text-sm font-bold text-[var(--fpt-blue)]"
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
                    className="rounded-full border border-[rgba(0,102,179,0.08)] bg-[var(--blue-soft)] px-3 py-2 text-sm font-semibold text-[var(--fpt-blue)] transition hover:border-[rgba(243,112,33,0.16)] hover:bg-[var(--orange-soft)] hover:text-[var(--fpt-orange)]"
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
