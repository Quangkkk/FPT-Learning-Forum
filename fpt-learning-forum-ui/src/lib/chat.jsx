import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './auth'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { auth, isSignedIn } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isSignedIn || !auth?.token) {
      setSocket(null)
      setConnected(false)
      return undefined
    }

    const s = io({
      path: '/socket.io',
      withCredentials: true,
      auth: { token: auth.token },
      transports: ['websocket', 'polling']
    })

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    setSocket(s)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.disconnect()
      setConnected(false)
      setSocket(null)
    }
  }, [isSignedIn, auth?.token])

  const value = useMemo(
    () => ({
      socket,
      connected
    }),
    [socket, connected]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside ChatProvider')
  return ctx
}
