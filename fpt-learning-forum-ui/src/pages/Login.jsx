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
        throw new Error("Đăng nhập thất bại")
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
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardBody>
          <div className="text-xl font-bold">Đăng nhập</div>
          <div className="mt-1 text-sm text-slate-600">
            Dùng tài khoản demo để test role-based UI.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Mật khẩu</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
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