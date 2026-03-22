import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'

export default function Register() {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký thất bại')
      }

      setSuccess(data.message || 'Đăng ký thành công, vui lòng kiểm tra email để xác minh.')
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardBody>
          <div className="text-xl font-bold">Đăng ký tài khoản</div>
          <div className="mt-1 text-sm text-slate-600">Tài khoản mới mặc định role student, active và cần xác minh email.</div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Họ tên</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            {error ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-3 text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-sky-700 hover:underline">
              Đăng nhập
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
