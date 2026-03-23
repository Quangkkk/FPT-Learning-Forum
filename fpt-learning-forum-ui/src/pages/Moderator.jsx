import React, { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ClipboardList, Eye, Flag, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../components/Card'
import Badge from '../components/Badge'
import { RequireRole, useAuth } from '../lib/auth'

function ModeratorInner() {
  const { user, auth } = useAuth()
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState([])
  const [reviewed, setReviewed] = useState([])
  const [pendingDetailPost, setPendingDetailPost] = useState(null)
  const [cancelTargetPost, setCancelTargetPost] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [reportActionTarget, setReportActionTarget] = useState(null)
  const [reportActionStatus, setReportActionStatus] = useState('resolved')
  const [reportActionReason, setReportActionReason] = useState('')
  const [reportActionSubmitting, setReportActionSubmitting] = useState(false)
  const [reports, setReports] = useState([])
  const [topics, setTopics] = useState([])
  const [categories, setCategories] = useState([])
  const [savingTopic, setSavingTopic] = useState(false)
  const [editingTopicId, setEditingTopicId] = useState(null)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [detailTopic, setDetailTopic] = useState(null)
  const [topicForm, setTopicForm] = useState({ name: '', categoryId: '' })

  const sections = useMemo(
    () => [
      { key: 'overview', label: 'Tổng quan', icon: ClipboardList },
      { key: 'pending', label: 'Duyệt bài', icon: CheckCircle2, count: pending.length },
      { key: 'reports', label: 'Báo cáo', icon: Flag, count: reports.length },
      { key: 'subjects', label: 'Môn học', icon: BookOpen, count: topics.length }
    ],
    [pending.length, reports.length, topics.length]
  )

  async function refresh() {
    setLoading(true)
    try {
      const [postsRes, reportsRes, topicsRes, categoriesRes] = await Promise.all([
        fetch('/api/posts', {
          headers: {
            Authorization: `Bearer ${auth?.token || ''}`
          }
        }),
        fetch('/api/reports', {
          headers: {
            Authorization: `Bearer ${auth?.token || ''}`
          }
        }),
        fetch('/api/admin/topics'),
        fetch('/api/admin/categories')
      ])

      const posts = await postsRes.json()
      const rep = reportsRes.ok ? await reportsRes.json() : []
      const topicData = topicsRes.ok ? await topicsRes.json() : []
      const categoryData = categoriesRes.ok ? await categoriesRes.json() : []

      const allPosts = Array.isArray(posts) ? posts : []
      const pendingPosts = allPosts.filter((p) => p.status === 'pending')
      const reviewedPosts = allPosts.filter((p) => p.status === 'approved' || p.status === 'rejected')

      const reviewedFallback = [
        {
          _id: 'demo-approved',
          title: '[Demo] Bài đã được duyệt',
          status: 'approved',
          moderationReason: '',
          createdAt: new Date().toISOString(),
          isFake: true
        },
        {
          _id: 'demo-rejected',
          title: '[Demo] Bài đã bị hủy',
          status: 'rejected',
          moderationReason: 'Nội dung chưa đúng chủ đề',
          createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          isFake: true
        }
      ]

      setPending(pendingPosts)
      setReviewed(reviewedPosts.length ? reviewedPosts : reviewedFallback)
      setReports(rep || [])
      setTopics(Array.isArray(topicData) ? topicData : [])

      const normalizedCategories = Array.isArray(categoryData)
        ? categoryData
        : categoryData?.categories || []

      setCategories(normalizedCategories)
      setTopicForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || normalizedCategories[0]?._id || ''
      }))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [auth?.token])

  async function setStatus(postId, status, reason = '') {
    try {
      const token = auth?.token

      if (!token) {
        alert('Bạn chưa đăng nhập!')
        return
      }

      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Có lỗi xảy ra khi thay đổi trạng thái bài viết')
        return
      }

      refresh()
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra, xem console để biết chi tiết.')
    }
  }

  function openPendingDetails(post) {
    setPendingDetailPost(post)
  }

  function closePendingDetails() {
    setPendingDetailPost(null)
  }

  function openCancelModal(post) {
    setCancelTargetPost(post)
    setCancelReason('')
  }

  function closeCancelModal() {
    setCancelTargetPost(null)
    setCancelReason('')
    setCancelSubmitting(false)
  }

  async function submitCancelPost() {
    const reason = cancelReason.trim()
    if (!cancelTargetPost?._id) return
    if (!reason) {
      alert('Vui lòng nhập lý do hủy bài')
      return
    }

    setCancelSubmitting(true)
    await setStatus(cancelTargetPost._id, 'rejected', reason)
    closeCancelModal()
  }

  function openReportActionModal(report, status) {
    setReportActionTarget(report)
    setReportActionStatus(status)
    setReportActionReason('')
  }

  function closeReportActionModal() {
    setReportActionTarget(null)
    setReportActionReason('')
    setReportActionSubmitting(false)
  }

  async function submitReportAction() {
    if (!reportActionTarget?._id) return
    const reason = reportActionReason.trim()

    if (!reason) {
      alert('Vui lòng nhập lý do xử lý report')
      return
    }

    if (!auth?.token) {
      alert('Bạn chưa đăng nhập')
      return
    }

    setReportActionSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${reportActionTarget._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          status: reportActionStatus,
          reason
        })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Không thể xử lý report')
        return
      }

      closeReportActionModal()
      refresh()
    } catch (err) {
      console.error(err)
      alert('Có lỗi khi xử lý report')
    } finally {
      setReportActionSubmitting(false)
    }
  }

  function startEditTopic(topic) {
    setEditingTopicId(topic._id)
    setTopicForm({
      name: topic.name,
      categoryId: topic.categoryId?._id || categories[0]?._id || ''
    })
    setIsTopicModalOpen(true)
    setActiveSection('subjects')
  }

  function resetTopicForm() {
    setEditingTopicId(null)
    setTopicForm({
      name: '',
      categoryId: categories[0]?._id || ''
    })
  }

  function openCreateTopicModal() {
    resetTopicForm()
    setIsTopicModalOpen(true)
  }

  function closeTopicModal() {
    setIsTopicModalOpen(false)
    resetTopicForm()
  }

  function openTopicDetails(topic) {
    setDetailTopic(topic)
  }

  function closeTopicDetails() {
    setDetailTopic(null)
  }

  async function submitTopic(e) {
    e.preventDefault()

    if (!topicForm.name.trim() || !topicForm.categoryId) {
      alert('Vui lòng điền đủ tên môn và danh mục')
      return
    }

    if (!auth?.token) {
      alert('Bạn chưa đăng nhập')
      return
    }

    setSavingTopic(true)
    try {
      const url = editingTopicId ? `/api/admin/topics/${editingTopicId}` : '/api/admin/topics'
      const method = editingTopicId ? 'PATCH' : 'POST'

      const payload = {
        name: topicForm.name.trim(),
        categoryId: topicForm.categoryId
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Không thể lưu môn học')
        return
      }

        resetTopicForm()
        setIsTopicModalOpen(false)
      refresh()
    } catch (err) {
      console.error(err)
      alert('Lỗi khi lưu môn học')
    } finally {
      setSavingTopic(false)
    }
  }

  async function deleteTopic(topicId) {
    if (!window.confirm('Bạn có chắc muốn xóa môn học này?')) return

    if (!auth?.token) {
      alert('Bạn chưa đăng nhập')
      return
    }

    try {
      const res = await fetch(`/api/admin/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Không thể xóa môn học')
        return
      }

      if (editingTopicId === topicId) {
        resetTopicForm()
      }

      refresh()
    } catch (err) {
      console.error(err)
      alert('Lỗi khi xóa môn học')
    }
  }

  const editingTopic = useMemo(
    () => topics.find((topic) => topic._id === editingTopicId) || null,
    [topics, editingTopicId]
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <aside className="rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-soft lg:sticky lg:top-4 lg:h-fit">
        <div className="rounded-xl bg-white/10 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-300">Moderator</div>
          <div className="mt-1 text-sm font-semibold">{user?.name || user?.email || 'Moderator'}</div>
        </div>

        <div className="mt-4 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.key

            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? 'bg-white text-slate-900'
                    : 'bg-white/0 text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {section.label}
                </span>
                {typeof section.count === 'number' ? (
                  <span className={`rounded-lg px-2 py-0.5 text-xs ${active ? 'bg-slate-100' : 'bg-white/20'}`}>
                    {section.count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </aside>

      <div className="space-y-4">
        {/* <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft">
          <div>
            <div className="text-xl font-bold">Moderator Workspace</div>
            <div className="mt-1 text-sm text-slate-600">
                Sidebar riêng cho điều hướng quản trị và quản lý môn học.
            </div>
          </div>

          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div> */}

        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-soft">Đang tải…</div>
        ) : null}

        {!loading && activeSection === 'overview' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardBody>
                <div className="text-xs text-slate-500">Bài chờ duyệt</div>
                <div className="mt-1 text-2xl font-bold text-amber-600">{pending.length}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-xs text-slate-500">Báo cáo mới</div>
                <div className="mt-1 text-2xl font-bold text-rose-600">{reports.length}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-xs text-slate-500">Môn học hiện có</div>
                <div className="mt-1 text-2xl font-bold text-sky-600">{topics.length}</div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {!loading && activeSection === 'pending' ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Bài chờ duyệt</div>
                  <Badge tone="amber">{pending.length}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                {pending.length === 0 ? (
                  <div className="text-sm text-slate-600">Không có bài chờ duyệt.</div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((p) => (
                      <div key={p._id} className="rounded-2xl border p-4">
                        <div className="font-semibold">{p.title}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(p.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => openPendingDetails(p)}
                            className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setStatus(p._id, 'approved')}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openCancelModal(p)}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Danh sách tất cả bài đã duyệt</div>
                  <Badge tone="sky">{reviewed.length}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {reviewed.map((p) => (
                    <div key={p._id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold">{p.title}</div>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {p.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                        {p.isFake ? ' • demo data' : ''}
                      </div>
                      {p.status === 'rejected' && p.moderationReason ? (
                        <div className="mt-2 text-sm text-slate-700">Lý do: {p.moderationReason}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {!loading && activeSection === 'reports' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Báo cáo nội dung</div>
                <Badge tone="red">{reports.length}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              {reports.length === 0 ? (
                <div className="text-sm text-slate-600">Chưa có báo cáo nào.</div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r._id} className="rounded-2xl border p-4">
                      <div className="flex justify-between">
                        <div className="font-semibold">
                          {r.targetType} • {r.targetId}
                        </div>
                        <Badge tone={r.status === 'resolved' ? 'sky' : r.status === 'cancelled' ? 'amber' : 'red'}>
                          {r.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">Lý do: {r.reason}</div>
                      {r.processReason ? (
                        <div className="mt-1 text-sm text-slate-700">Kết quả xử lý: {r.processReason}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString('vi-VN')}
                      </div>
                      {r.status === 'pending' ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => openReportActionModal(r, 'resolved')}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Resolved
                          </button>
                          <button
                            onClick={() => openReportActionModal(r, 'cancelled')}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        ) : null}

        {!loading && activeSection === 'subjects' ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Quản lý môn học</div>
                  <button
                    onClick={openCreateTopicModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo mới
                  </button>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Danh sách môn học</div>
                  <Badge tone="sky">{topics.length}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-3 py-2">Tên môn</th>
                        <th className="px-3 py-2">Slug</th>
                        <th className="px-3 py-2">Danh mục</th>
                        <th className="px-3 py-2 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topics.map((topic) => (
                        <tr key={topic._id} className="border-t">
                          <td className="px-3 py-2 font-medium">{topic.name}</td>
                          <td className="px-3 py-2 text-slate-600">{topic.slug}</td>
                          <td className="px-3 py-2 text-slate-600">{topic.categoryId?.name || 'N/A'}</td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEditTopic(topic)}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-amber-700"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Sửa
                              </button>
                              <button
                                onClick={() => openTopicDetails(topic)}
                                className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-1 text-sky-700"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Details
                              </button>
                              <button
                                onClick={() => deleteTopic(topic._id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>

      {isTopicModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">
                  {editingTopicId ? 'Cập nhật môn học' : 'Tạo mới môn học'}
                </div>
                <div className="mt-1 text-sm text-slate-500">Thêm thông tin tên môn và danh mục.</div>
              </div>
              <button
                onClick={closeTopicModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitTopic} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold">Tên môn học</label>
                  <input
                    value={topicForm.name}
                    onChange={(e) => setTopicForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ví dụ: CSD201 - Data Structures & Algorithms"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold">Danh mục</label>
                  <select
                    value={topicForm.categoryId}
                    onChange={(e) => setTopicForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={closeTopicModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {editingTopicId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {savingTopic ? 'Đang lưu...' : editingTopicId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailTopic ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">Chi tiết môn học</div>
                <div className="mt-1 text-sm text-slate-500">{detailTopic.name}</div>
              </div>
              <button
                onClick={closeTopicDetails}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Slug</div>
                  <div className="mt-1 text-sm font-semibold">{detailTopic.slug}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Danh mục</div>
                  <div className="mt-1 text-sm font-semibold">{detailTopic.categoryId?.name || 'N/A'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Ngày tạo</div>
                  <div className="mt-1 text-sm font-semibold">
                    {detailTopic.createdAt ? new Date(detailTopic.createdAt).toLocaleString('vi-VN') : '-'}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}

      {pendingDetailPost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">Chi tiết bài chờ duyệt</div>
                <div className="mt-1 text-sm text-slate-500">{pendingDetailPost.title}</div>
              </div>
              <button
                onClick={closePendingDetails}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Người đăng</div>
                  <div className="mt-1 text-sm font-semibold">
                    {pendingDetailPost.isAnonymous
                      ? 'Ẩn danh'
                      : pendingDetailPost.authorId?.name || pendingDetailPost.authorId?.email || 'N/A'}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Trạng thái</div>
                  <div className="mt-1 text-sm font-semibold capitalize">{pendingDetailPost.status}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Ngày tạo</div>
                  <div className="mt-1 text-sm font-semibold">
                    {new Date(pendingDetailPost.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm font-semibold">Nội dung</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{pendingDetailPost.content}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cancelTargetPost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">Hủy bài viết</div>
                <div className="mt-1 text-sm text-slate-500">Nhập lý do để thông báo cho người đăng bài.</div>
              </div>
              <button
                onClick={closeCancelModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="font-semibold">{cancelTargetPost.title}</div>
              </div>

              <div>
                <label className="text-sm font-semibold">Lý do hủy</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  placeholder="Ví dụ: Nội dung chưa phù hợp, cần bổ sung nguồn dẫn chứng..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  onClick={closeCancelModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Đóng
                </button>
                <button
                  onClick={submitCancelPost}
                  disabled={cancelSubmitting}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {cancelSubmitting ? 'Đang gửi...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reportActionTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">
                  {reportActionStatus === 'resolved' ? 'Đánh dấu Resolved report' : 'Cancel report'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Report: {reportActionTarget.targetType} • {reportActionTarget.targetId}
                </div>
              </div>
              <button
                onClick={closeReportActionModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div>
                <label className="text-sm font-semibold">Lý do xử lý</label>
                <textarea
                  value={reportActionReason}
                  onChange={(e) => setReportActionReason(e.target.value)}
                  rows={4}
                  placeholder="Nhập lý do cho thao tác này..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  onClick={closeReportActionModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Đóng
                </button>
                <button
                  onClick={submitReportAction}
                  disabled={reportActionSubmitting}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                    reportActionStatus === 'resolved' ? 'bg-emerald-600' : 'bg-rose-600'
                  } disabled:opacity-60`}
                >
                  {reportActionSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Moderator() {
  return (
    <RequireRole allow={['moderator', 'admin']}>
      <ModeratorInner />
    </RequireRole>
  )
}