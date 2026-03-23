import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, RequireRole } from './lib/auth'
import { ChatProvider } from './lib/chat'
import Shell from './layout/Shell'

import Home from './pages/Home'
import Category from './pages/Category'
import Topic from './pages/Topic'
import NewPosts from './pages/NewPosts'
import PostDetail from './pages/PostDetail'
import CreatePost from './pages/CreatePost'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Search from './pages/Search'
import Members from './pages/Members'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Moderator from './pages/Moderator'
import Admin from './pages/Admin'
import AdminTopic from './pages/AdminTopics'
import AdminCategories from './pages/AdminCategories'

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewPosts />} />
          <Route path="/c/:categoryId" element={<Category />} />
          <Route path="/topic/:topicId" element={<Topic />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route
            path="/create"
            element={
              <RequireRole allow={['student', 'moderator', 'admin']}>
                <CreatePost />
              </RequireRole>
            }
          />
          <Route path="/search" element={<Search />} />
          <Route path="/members" element={<Members />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route
            path="/chat"
            element={
              <RequireRole allow={['student', 'moderator', 'admin']}>
                <Chat />
              </RequireRole>
            }
          />
          <Route
            path="/chat/:peerId"
            element={
              <RequireRole allow={['student', 'moderator', 'admin']}>
                <Chat />
              </RequireRole>
            }
          />
          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/moderator"
            element={
              <RequireRole allow={['moderator', 'admin']}>
                <Moderator />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole allow={['admin']}>
                <Admin />
              </RequireRole>
            }
          />
          <Route
            path="/admin/topics"
            element={
              <RequireRole allow={['admin']}>
                <AdminTopic />
              </RequireRole>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <RequireRole allow={['admin']}>
                <AdminCategories />
              </RequireRole>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </ChatProvider>
    </AuthProvider>
  )
}
