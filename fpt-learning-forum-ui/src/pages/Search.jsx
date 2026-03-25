import React from 'react'
import { useSearchParams } from 'react-router-dom'
import TopicTable from '../components/TopicTable'
import { useAuth } from '../lib/auth'
import { fetchJson } from '../lib/api'

export default function Search() {
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const { role } = useAuth()

  const [loading, setLoading] = React.useState(true)
  const [posts, setPosts] = React.useState([])
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      setError('')

      try {
        const items = await fetchJson(`/api/search/posts?q=${encodeURIComponent(q)}`)
        const visible =
          role === 'student' || role === 'guest'
            ? items.filter((p) => p.status !== 'pending')
            : items

        if (alive) {
          setPosts(visible)
        }
      } catch (err) {
        if (alive) {
          setPosts([])
          setError(err.message || 'Khong the tim kiem bai viet')
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
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
        <div className="mt-2 text-lg font-semibold">Ket qua tim kiem</div>
        <div className="mt-1 text-sm text-slate-600">
          Tu khoa: <b>{q}</b> - {posts.length} ket qua
        </div>
      </div>

      {loading ? (
        <div className="app-surface rounded-[28px] p-6">Dang tai...</div>
      ) : error ? (
        <div className="app-surface rounded-[28px] p-6 text-sm text-rose-600">{error}</div>
      ) : (
        <TopicTable posts={posts} />
      )}
    </div>
  )
}
