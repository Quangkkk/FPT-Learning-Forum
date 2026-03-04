import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import TopicTable from '../components/TopicTable'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'

export default function Topic() {
  const { topicId } = useParams()
  const { role } = useAuth()

  const [forum, setForum] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      try {
        // load forum data
        const forumRes = await fetch("/api/forum")
        const forumData = await forumRes.json()

        // load posts theo topic
        const postRes = await fetch(`/api/posts?topicId=${topicId}`)
        const postData = await postRes.json()

        const visible =
          role === 'student' || role === 'guest'
            ? (postData || []).filter((p) => p.status !== 'pending')
            : postData || []

        if (alive) {
          setForum(forumData)
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
  }, [topicId, role])

  if (loading)
    return <div className="rounded-2xl bg-white p-6 shadow-soft">Đang tải…</div>

  const topicName = forum?.topics?.[topicId]?.name || topicId

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{topicName}</div>
            <div className="text-sm text-slate-600">
              Các bài viết trong chủ đề này.
            </div>
          </div>

          <Link
            to={`/create?topic=${encodeURIComponent(topicId)}`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Tạo bài viết
          </Link>
        </CardBody>
      </Card>

      <TopicTable posts={posts} showTopic={false} />
    </div>
  )
}