import React from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'

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
  return (
    <div className="app-surface overflow-hidden rounded-[28px]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[linear-gradient(90deg,rgba(238,247,255,0.96),rgba(255,244,236,0.92))] text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
            <tr>
              <th className="w-14 px-3 py-3">#</th>
              <th className="px-3 py-3">Chủ đề</th>
              <th className="hidden px-3 py-3 md:table-cell">Ngày</th>
              <th className="hidden px-3 py-3 md:table-cell">Tác giả</th>
              <th className="hidden px-3 py-3 lg:table-cell">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p, idx) => (
              <tr key={p._id ?? idx} className="border-t border-[var(--border)] transition-colors hover:bg-[rgba(238,247,255,0.46)]">
                <td className="px-3 py-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--fpt-orange),#ff8a3d)] text-xs font-bold text-white shadow-[0_10px_20px_rgba(243,112,33,0.24)]">
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
                      className="font-semibold text-[var(--fpt-blue)] hover:text-[var(--fpt-orange)]"
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
                    ? 'Ẩn danh'
                    : (p.authorId?.email || p.authorId?.name || 'Ẩn danh')}
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
