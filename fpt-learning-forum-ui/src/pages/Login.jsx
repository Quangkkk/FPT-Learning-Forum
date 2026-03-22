import React from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'

export default function Login() {
  const nav = useNavigate()
  const location = useLocation()
  const { signIn, isSignedIn, loading: authLoading } = useAuth()

  const [email, setEmail] = React.useState('student@fpt.edu.vn')
  const [password, setPassword] = React.useState('123456')
  const [error, setError] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const fromPath =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : null

  React.useEffect(() => {
    if (!authLoading && isSignedIn) {
      nav('/', { replace: true })
    }
  }, [isSignedIn, authLoading, nav])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const auth = await signIn(email.trim(), password)

      if (!auth?.user) {
        throw new Error('Đăng nhập thất bại')
      }

      if (fromPath && fromPath !== '/login') {
        nav(fromPath, { replace: true })
      } else if (auth.user.role === 'admin') nav('/admin', { replace: true })
      else if (auth.user.role === 'moderator') nav('/moderator', { replace: true })
      else nav('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hero-panel bg-grid rounded-[32px] p-8">
          <div className="section-kicker">Chào mừng trở lại</div>
          <div className="mt-3 text-3xl font-bold">Đăng nhập để tiếp tục học tập và trao đổi cùng cộng đồng FPT.</div>
          <div className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Theo dõi bài viết theo môn học, tham gia thảo luận, lưu lại những nội dung quan trọng và quản lý hoạt động của bạn trên diễn đàn.
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/80 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--fpt-orange)]">Truy cập</div>
              <div className="mt-2 text-sm font-semibold">Xem lại bài viết và thảo luận đang theo dõi</div>
            </div>
            <div className="rounded-[24px] bg-white/80 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--fpt-blue)]">Tìm kiếm</div>
              <div className="mt-2 text-sm font-semibold">Tra cứu nhanh nội dung theo môn học và chủ đề</div>
            </div>
            <div className="rounded-[24px] bg-white/80 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--fpt-green)]">Theo dõi</div>
              <div className="mt-2 text-sm font-semibold">Cập nhật phản hồi, thông báo và hoạt động gần đây</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody>
              <div className="section-kicker">Demo Account</div>
              <div className="mt-2 text-xl font-bold">Đăng nhập</div>
              <div className="mt-1 text-sm text-slate-600">
                Dùng tài khoản demo để kiểm tra giao diện theo từng vai trò.
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-shell mt-1 w-full rounded-2xl px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Mật khẩu</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="input-shell mt-1 w-full rounded-2xl px-4 py-3 text-sm"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-3 text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-sky-700 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
