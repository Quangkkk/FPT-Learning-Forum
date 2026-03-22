import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopicTable from '../components/TopicTable'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'

export default function NewPosts() {
  const { role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/posts')
        const items = await res.json()

        const visible =
          role === 'student' || role === 'guest'
            ? (items || []).filter((p) => p.status !== 'pending')
            : items || []

        if (alive) {
          setPosts(visible)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [role])

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="section-kicker">Fresh Feed</div>
            <div className="mt-1 text-lg font-semibold">Bài viết mới</div>
            <div className="text-sm text-slate-600">
              Danh sách bài mới nhất trong toàn diễn đàn.
            </div>
          </div>

          <Link
            to="/create"
            className="btn-primary rounded-full px-5 py-3 text-sm font-bold"
          >
            Đăng bài nhanh
          </Link>
        </CardBody>
      </Card>

      {loading ? (
        <div className="app-surface rounded-[28px] p-6">Đang tải...</div>
      ) : (
        <TopicTable posts={posts} showTopic={true} />
      )}
    </div>
  )
}
