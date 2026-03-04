import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'
import { useAuth } from '../lib/auth'

export default function Login() {
  const nav = useNavigate()
  const { signIn } = useAuth()

  const [email, setEmail] = React.useState('student@fpt.edu.vn')
  const [password, setPassword] = React.useState('123456')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const auth = await signIn(email.trim(), password)

      if (!auth?.user) {
        throw new Error("Đăng nhập thất bại")
      }

      if (auth.user.role === 'admin') nav('/admin')
      else if (auth.user.role === 'moderator') nav('/moderator')
      else nav('/')
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
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
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}