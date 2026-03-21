import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Shell from './layout/Shell'

import Home from './pages/Home'
import Category from './pages/Category'
import Topic from './pages/Topic'
import NewPosts from './pages/NewPosts'
import PostDetail from './pages/PostDetail'
import CreatePost from './pages/CreatePost'
import Login from './pages/Login'
import Search from './pages/Search'
import Members from './pages/Members'
import Notifications from './pages/Notifications'
import Moderator from './pages/Moderator'
import Admin from './pages/Admin'
import AdminTopic from './pages/AdminTopics'
import AdminCategories from './pages/AdminCategories'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewPosts />} />
          <Route path="/c/:categoryId" element={<Category />} />
          <Route path="/topic/:topicId" element={<Topic />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/search" element={<Search />} />
          <Route path="/members" element={<Members />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/moderator" element={<Moderator />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/topics" element={<AdminTopic />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
