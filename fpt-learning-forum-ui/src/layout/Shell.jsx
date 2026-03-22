import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Search, Users, Bell, BookOpen, MessageSquare, Shield, Sparkles } from 'lucide-react'
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
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
        loc.pathname.startsWith(href)
          ? 'border-white/25 bg-white text-[var(--fpt-blue)] shadow-[0_10px_24px_rgba(255,255,255,0.22)]'
          : 'border-white/12 bg-white/10 text-white/92 hover:bg-white/18'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

  return (
    <header className="border-b border-white/10 bg-[linear-gradient(120deg,#0066B3_0%,#0C7ED1_52%,#0A5D9B_100%)] text-white shadow-[0_22px_48px_rgba(0,102,179,0.24)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-[300px] flex-1 items-start gap-3">
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-['Montserrat'] text-xl font-bold leading-none text-white whitespace-nowrap">FPT Learning Forum</div>
            <div className="mt-2 max-w-[320px] text-sm leading-6 text-white/78">
              Cộng đồng học tập, chia sẻ tài liệu và kết nối sinh viên FPT University.
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="relative hidden w-[360px] md:block xl:w-[420px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              const value = e.target.value
              setQ(value)

              if (value.trim() === '') {
                nav('/')
              }
            }}
            placeholder="Tìm kiếm..."
            className="w-full rounded-full border border-white/20 bg-white px-10 py-3 text-sm text-slate-800 outline-none transition focus:border-[rgba(243,112,33,0.4)] focus:shadow-[0_0_0_4px_rgba(243,112,33,0.16)]"
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
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--fpt-orange),#ff8a3d)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(243,112,33,0.34)] transition hover:-translate-y-0.5"
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
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/18"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-4 md:hidden">
        <form onSubmit={submit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full rounded-full border border-white/20 bg-white px-10 py-3 text-sm text-slate-800 outline-none transition focus:border-[rgba(243,112,33,0.4)] focus:shadow-[0_0_0_4px_rgba(243,112,33,0.16)]"
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
    fetch('/api/forum')
      .then((res) => res.json())
      .then((data) => setForum(data))
      .catch((err) => console.error(err))
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
    <div className="border-b border-[var(--border)] bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => nav(t.href)}
            className={cn(
              'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all',
              loc.pathname === t.href
                ? 'border-[rgba(243,112,33,0.18)] bg-[var(--orange-soft)] text-[var(--fpt-orange)]'
                : 'border-transparent bg-transparent text-slate-600 hover:border-[rgba(0,102,179,0.08)] hover:bg-[var(--blue-soft)] hover:text-[var(--fpt-blue)]'
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
  const [keyword, setKeyword] = React.useState('')
  const [users, setUsers] = React.useState([])

  React.useEffect(() => {
    fetch('http://localhost:5000/api/forum')
      .then((res) => res.json())
      .then((data) => setForum(data))
  }, [])

  React.useEffect(() => {
    if (!keyword) {
      setUsers([])
      return
    }

    fetch(`http://localhost:5000/api/search/users?q=${keyword}`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
  }, [keyword])

  return (
    <aside className="hidden w-[320px] shrink-0 lg:block">
      <div className="sticky top-4 space-y-4">
        <div className="app-surface rounded-[28px] p-5">
          <div className="section-kicker">Connect</div>
          <div className="mt-2 text-sm font-semibold">Tìm thành viên</div>

          <div className="mt-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tên..."
              className="input-shell w-full rounded-2xl px-3 py-2.5 text-sm"
            />
          </div>

          <div className="mt-2 space-y-1">
            {users.map((u) => (
              <div
                key={u._id}
                className="rounded-2xl px-3 py-2 text-sm transition hover:bg-[var(--blue-soft)]"
              >
                {u.name || u.email}
              </div>
            ))}
          </div>
        </div>

        <div className="app-surface rounded-[28px] p-5">
          <div className="section-kicker">Highlights</div>
          <div className="mt-2 text-sm font-semibold">Môn học nổi bật</div>

          <div className="mt-3 space-y-2">
            {forum?.topics &&
              Object.entries(forum.topics).map(([id, topic]) => (
                <button
                  key={id}
                  onClick={() => nav(`/topic/${id}`)}
                  className="block w-full rounded-2xl border border-transparent bg-[var(--blue-soft)] px-3 py-3 text-left text-sm font-medium text-[var(--text)] transition hover:border-[rgba(0,102,179,0.14)] hover:bg-white"
                >
                  {topic.name}
                </button>
              ))}
          </div>
        </div>

        {(role === 'admin' || role === 'moderator') && (
          <div className="rounded-[28px] border border-[rgba(13,177,75,0.12)] bg-[linear-gradient(135deg,var(--green-soft),white)] p-5 shadow-soft">
            <div className="section-kicker text-[var(--fpt-green)]">Workspace</div>
            <div className="mt-2 text-sm font-semibold">Khu vực quản trị</div>
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
    <div className="app-shell min-h-screen">
      <TopBar />
      {!isManagementPage && <CategoryTabs />}
      <main
        className={`mx-auto flex-1 px-4 py-4 ${
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
      <footer className="border-t border-[var(--border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-['Montserrat'] text-base font-bold text-slate-800">FPT Learning Forum</div>
            <div className="max-w-xl text-xs leading-5 text-slate-500">
              Nền tảng trao đổi học thuật dành cho sinh viên FPT University, hỗ trợ chia sẻ kiến thức, tài liệu và kết nối cộng đồng học tập một cách chuyên nghiệp.
            </div>
          </div>
          <div className="text-right text-xs leading-5 text-slate-500">
            <div>Academic Community Platform</div>
            <div>Designed for FPT University Students</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
