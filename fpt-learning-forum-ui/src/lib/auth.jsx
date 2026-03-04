import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuth, loadAuth, saveAuth } from './storage'


const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = loadAuth()
    setAuth(saved)
    setLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      loading,
      auth,
      isSignedIn: !!auth?.token,
      role: auth?.user?.role || 'guest',

      async signIn(email, password) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || "Login failed")
        }

        const next = { token: data.token, user: data.user }
        setAuth(next)
        saveAuth(next)

        return next   // 👈 THÊM DÒNG NÀY
      },

      signOut() {
        clearAuth()
        setAuth(null)
      }
    }),
    [auth, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function RequireRole({ allow = ['student', 'moderator', 'admin'], children }) {
  const { loading, role } = useAuth()
  if (loading) return <div className="p-6">Đang tải…</div>
  if (!allow.includes(role)) {
    return (
      <div className="p-6">
        <div className="max-w-xl rounded-2xl bg-white p-6 shadow-soft">
          <div className="text-lg font-semibold">Bạn chưa đăng nhập / không có quyền</div>
          <div className="mt-1 text-sm text-slate-600">Hãy đăng nhập đúng vai trò để truy cập trang này.</div>
        </div>
      </div>
    )
  }
  return children
}
