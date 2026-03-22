import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Search, Users, Bell, BookOpen, MessageSquare, Shield } from 'lucide-react'
import { cn } from '../lib/cn'
import { useAuth } from '../lib/auth'


function TopBar() {
  const { isSignedIn, signOut, role } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [q, setQ] = React.useState('')

  function submit(e) {
    e.preventDefault()
    const next = q.trim()
    if (!next) return
    nav(`/search?q=${encodeURIComponent(next)}`)
  }

  const pill = (label, Icon, href) => (
    <button
      onClick={() => nav(href)}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10',
        loc.pathname.startsWith(href) && 'bg-white/15'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

  return (
    <header className="bg-sky-500">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Cộng đồng Học sinh Việt Nam</div>
          <div className="text-xs text-white/80">Learning Forum • FPT University</div>
        </div>

        <form onSubmit={submit} className="relative hidden w-[420px] md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              const value = e.target.value
              setQ(value)

              if (value.trim() === "") {
                nav("/")
              }
            }}
            placeholder="Tìm kiếm…"
            className="w-full rounded-xl bg-white px-10 py-2 text-sm outline-none ring-1 ring-sky-200 focus:ring-2 focus:ring-white"
          />
        </form>

        <div className="hidden items-center gap-2 lg:flex">
          {pill('Diễn đàn', BookOpen, '/')}
          {pill('Bài mới', MessageSquare, '/new')}
          {pill('Thành viên', Users, '/members')}
          {pill('Thông báo', Bell, '/notifications')}
          {role === 'moderator' && pill('Moderator', Shield, '/moderator')}
          {role === 'admin' && pill('Admin', Shield, '/admin')}
        </div>

        {!isSignedIn ? (
          <button
            onClick={() => nav('/login')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-sky-700 shadow-soft hover:bg-sky-50"
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </button>
        ) : (
          <button
            onClick={() => {
              signOut()
              nav('/login')
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        )}
      </div>

      {/* mobile search */}
      <div className="mx-auto max-w-6xl px-4 pb-4 md:hidden">
        <form onSubmit={submit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm…"
            className="w-full rounded-xl bg-white px-10 py-2 text-sm outline-none ring-1 ring-sky-200 focus:ring-2 focus:ring-white"
          />
        </form>
      </div>
    </header>
  )
}

function CategoryTabs() {
  const nav = useNavigate()
  const loc = useLocation()
  const [forum, setForum] = useState(null)

  useEffect(() => {
    fetch("/api/forum")
      .then(res => res.json())
      .then(data => setForum(data))
      .catch(err => console.error(err))
  }, [])

  if (!forum) return null

  const tabs = [
    { id: 'all', label: 'Bài viết mới', href: '/new' },
    ...(forum.categories || []).map((c) => ({
      id: c.id,
      label: c.name,
      href: `/c/${c.id}`
    }))
  ]

  return (
    <div className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => nav(t.href)}
            className={cn(
              'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50',
              loc.pathname === t.href && 'bg-sky-50 text-sky-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
function RightSidebar() {
  const nav = useNavigate()
  const { role } = useAuth()
  const [forum, setForum] = React.useState(null)

  const [keyword, setKeyword] = React.useState("")
  const [users, setUsers] = React.useState([])

  React.useEffect(() => {
    fetch("http://localhost:5000/api/forum")
      .then(res => res.json())
      .then(data => setForum(data))
  }, [])

  React.useEffect(() => {
    if (!keyword) {
      setUsers([])
      return
    }

    fetch(`http://localhost:5000/api/search/users?q=${keyword}`)
      .then(res => res.json())
      .then(data => setUsers(data))
  }, [keyword])
  return (
    <aside className="hidden w-[320px] shrink-0 lg:block">
      <div className="sticky top-4 space-y-4">

        {/* Search */}
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="text-sm font-semibold">Tìm thành viên</div>

          <div className="mt-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tên..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="mt-2 space-y-1">
            {users.map((u) => (
              <div
                key={u._id}
                className="rounded-lg px-2 py-1 text-sm hover:bg-slate-100"
              >
                {u.name || u.email}
              </div>
            ))}
          </div>
        </div>
        {/* Recommended Topics */}
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="text-sm font-semibold">Môn học nổi bật</div>

          <div className="mt-3 space-y-2">
            {forum?.topics &&
              Object.entries(forum.topics).map(([id, topic]) => (
                <button
                  key={id}
                  onClick={() => nav(`/topic/${id}`)}
                  className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  📘 {topic.name}
                </button>
              ))
            }
          </div>
        </div>

        {/* Admin area */}
        {(role === 'admin' || role === 'moderator') && (
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white p-4 shadow-soft">
            <div className="text-sm font-semibold">Khu vực quản trị</div>
            <div className="mt-2 text-sm text-slate-600">
              Duyệt bài, xử lý report, xem thống kê.
            </div>
          </div>
        )}

      </div>
    </aside>
  )
}

export default function Shell() {
  const loc = useLocation()
  const isManagementPage =
    loc.pathname.startsWith('/moderator') || loc.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen">
      <TopBar />
      {!isManagementPage && <CategoryTabs />}
      <main
        className={`mx-auto px-4 py-4 ${
          isManagementPage
            ? 'max-w-7xl'
            : 'grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]'
        }`}
      >
        <div className="min-w-0">
          <Outlet />
        </div>
        {!isManagementPage && <RightSidebar />}
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500">
          Demo UI • Learning Forum for FPT University Students
        </div>
      </footer>
    </div>
  )
}
