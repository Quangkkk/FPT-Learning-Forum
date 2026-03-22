import React from 'react'
import { useSearchParams } from 'react-router-dom'
import TopicTable from '../components/TopicTable'
import { useAuth } from '../lib/auth'

export default function Search() {
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const { role } = useAuth()

  const [loading, setLoading] = React.useState(true)
  const [posts, setPosts] = React.useState([])

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)

      const res = await fetch(`http://localhost:5000/api/search/posts?q=${q}`)
      const items = await res.json()

      const visible =
        role === 'student' || role === 'guest'
          ? items.filter((p) => p.status !== 'pending')
          : items

      if (alive) {
        setPosts(visible)
        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [q, role])

  return (
    <div className="space-y-4">
      <div className="hero-panel rounded-[32px] p-6">
        <div className="section-kicker">Search</div>
        <div className="mt-2 text-lg font-semibold">Kết quả tìm kiếm</div>
        <div className="mt-1 text-sm text-slate-600">
          Từ khóa: <b>{q}</b> • {posts.length} kết quả
        </div>
      </div>

      {loading ? (
        <div className="app-surface rounded-[28px] p-6">Đang tải...</div>
      ) : (
        <TopicTable posts={posts} />
      )}
    </div>
  )
}
