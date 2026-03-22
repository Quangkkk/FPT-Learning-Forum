import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, CardBody } from '../components/Card'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = React.useState('loading')
  const [message, setMessage] = React.useState('Đang xác minh email...')

  React.useEffect(() => {
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Thiếu token xác minh email.')
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Xác minh thất bại')
        }

        setStatus('success')
        setMessage(data.message || 'Xác minh email thành công.')
      } catch (err) {
        const msg = err.message || 'Xác minh thất bại'
        const isResent = msg.toLowerCase().includes('đã gửi link mới')
        setStatus(isResent ? 'resent' : 'error')
        setMessage(msg)
      }
    })()
  }, [params])

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardBody>
          <div className="text-xl font-bold">Xác minh email</div>
          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              status === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : status === 'resent'
                ? 'bg-amber-50 text-amber-700'
                : status === 'error'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {message}
          </div>

          <div className="mt-4 text-sm">
            <Link to="/login" className="font-semibold text-sky-700 hover:underline">
              Về trang đăng nhập
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
