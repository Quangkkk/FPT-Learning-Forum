import React, { useEffect, useState } from 'react'
import TopicTable from '../components/TopicTable'
import { Card, CardBody } from '../components/Card'
import { Link } from 'react-router-dom'
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
        const res = await fetch("/api/posts")
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
            <div className="text-lg font-semibold">Bài viết mới</div>
            <div className="text-sm text-slate-600">
              Danh sách bài mới nhất trong toàn diễn đàn.
            </div>
          </div>

          <Link
            to="/create"
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Đăng bài nhanh
          </Link>
        </CardBody>
      </Card>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          Đang tải…
        </div>
      ) : (
        <TopicTable posts={posts} showTopic={true} />
      )}
    </div>
  )
}