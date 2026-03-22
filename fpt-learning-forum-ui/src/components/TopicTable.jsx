import React from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import { cn } from '../lib/cn'


function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function topicTone(topicId) {
  if (topicId === 'toan') return 'sky'
  if (topicId === 'hoa') return 'amber'
  if (topicId === 'vat-li') return 'green'
  if (topicId === 'ngoai-ngu') return 'slate'
  return 'sky'
}

export default function TopicTable({ posts, forum, showTopic = true }) {
  const usersById = Object.fromEntries(
    (forum?.users || []).map((u) => [u._id, u])
  )

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
            <tr>
              <th className="w-12 px-3 py-3">#</th>
              <th className="px-3 py-3">Chủ đề</th>
              <th className="hidden px-3 py-3 md:table-cell">Ngày</th>
              <th className="hidden px-3 py-3 md:table-cell">Tác giả</th>
              <th className="hidden px-3 py-3 lg:table-cell">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p, idx) => (
              <tr key={p._id ?? idx} className="border-t hover:bg-slate-50">
                <td className="px-3 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {showTopic && (
                      <Badge tone={topicTone(p.topicId)}>
                        {forum?.topics?.[p.topicId]?.name || p.topicId}
                      </Badge>
                    )}

                    <Link
                      to={`/post/${p._id}`}
                      className="font-semibold text-sky-700 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {p.views} lượt xem • {p.upvotes} upvote
                  </div>
                </td>

                <td className="hidden px-3 py-3 md:table-cell">
                  {formatDate(p.createdAt)}
                </td>

                <td className="hidden px-3 py-3 md:table-cell">
                  {p.isAnonymous
                    ? "Ẩn danh"
                    : (p.authorId?.email || p.authorId?.name || "Ẩn danh")}
                </td>

                <td className="hidden px-3 py-3 lg:table-cell">
                  {p.status === 'pending'
                    ? <Badge tone="amber">Chờ duyệt</Badge>
                    : <Badge tone="green">Đã đăng</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
