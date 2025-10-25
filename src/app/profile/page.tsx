"use client"

import { useEffect, useRef, useState } from 'react'
import { forceClientLogout, usersAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

type UserProfile = {
  id: string
  name?: string
  email?: string
  phone?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const { user: authUser } = useAuth()
  const didFetchRef = useRef(false)

  

  useEffect(() => {
    // Prevent duplicate fetches (StrictMode or multiple mounts)
    if (didFetchRef.current) return
    didFetchRef.current = true

    // If AuthContext already has user data, reuse it and skip network fetch
    if (authUser) {
      const payload: UserProfile = {
        id: authUser.id,
        name: authUser.name || '',
        email: (authUser as any).email || '',
        phone: (authUser as any).phone || ''
      }
      setUser(payload)
      setForm({ name: payload.name || '', email: payload.email || '', phone: payload.phone || '' })
      try { localStorage.setItem('user', JSON.stringify(payload)) } catch (e) {}
      return
    }

    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // require an id from stored user; if missing, force login
        if (!parsed.id) {
          if (typeof window !== 'undefined') window.location.href = '/auth/login'
          return
        }
        setUser(parsed)
        // fetch fresh profile using centralized usersAPI
        fetchProfile(parsed.id)
      } catch (e) {
        // parse error or malformed user -> require login
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      }
    } else {
      // No local user — try to fetch from API if token exists
      if (token) {
        fetchProfileViaAuth()
      } else {
        // No token and no local user — require login
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  async function fetchProfileViaAuth() {
    setLoading(true)
    setError(null)
    try {
      // Use centralized usersAPI to fetch
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
      if (!userId) throw new Error('Không tìm thấy user ID')
      const resp: any = await usersAPI.getUser(userId)
      const profile: any = resp?.user ?? resp
      if (profile && profile.id) {
        const payload: UserProfile = {
          id: profile.id || profile.uid || profile._id || profile.ID,
          name: profile.name || profile.fullname || profile.email?.split?.('@')?.[0] || '',
          email: profile.email || '',
          phone: profile.phone || profile.mobile || '',
        }
        setUser(payload)
        setForm({ name: payload.name || '', email: payload.email || '', phone: payload.phone || '' })
        try { localStorage.setItem('user', JSON.stringify(payload)) } catch (e) {}
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfile(id: string) {
    setLoading(true)
    setError(null)
    try {
      // Centralized usersAPI call
      const resp: any = await usersAPI.getUser(id)
      const data: any = resp?.user ?? resp
      const bodyErr = data && (data.error || data.message || data.msg)
      if (typeof bodyErr === 'string' && /token\s*(is\s*)?expired|expired\s*token/i.test(bodyErr)) {
        // token expired, force logout
        try { const mod = await import('@/lib/api'); mod.forceClientLogout(); } catch (e) { window.location.href = '/' }
        return
      }
      const profile: any = data
      if (profile) {
        const payload: UserProfile = {
          id: profile.id || profile.uid || profile._id || profile.ID || profile.uuid || profile.user_id,
          name: profile.name || profile.fullname || profile.email?.split?.('@')?.[0] || '',
          email: profile.email || '',
          phone: profile.phone || profile.mobile || '',
        }
        setUser(payload)
        setForm({ name: payload.name || '', email: payload.email || '', phone: payload.phone || '' })
        try { localStorage.setItem('user', JSON.stringify(payload)) } catch (e) {}
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      await usersAPI.updateUser(user.id, form)
      // Refresh local profile
      await fetchProfile(user.id)
      setEditing(false)
    } catch (err: any) {
      setError(err?.message || 'Cập nhật thất bại')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!user) return
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return
    setLoading(true)
    setError(null)
    try {
      await usersAPI.deleteUser(user.id)
      // Clear local storage and redirect to home
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message || 'Xóa thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-white">Đang tải...</div>

  if (!user) return (
    <div className="p-6 text-white">
      <p>Không tìm thấy người dùng. Vui lòng <Link href="/auth/login" className="text-orange-300">đăng nhập</Link>.</p>
    </div>
  )

  return (
    <div className="p-6 text-white max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Thông tin cá nhân</h1>

      {error && <div className="mb-4 text-red-400">{error}</div>}

      {!editing ? (
        <div className="space-y-3">
          <div><strong>Họ tên:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Số điện thoại:</strong> {user.phone}</div>
          <div className="mt-4 space-x-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-orange-500 rounded">Chỉnh sửa</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 rounded">Xóa tài khoản</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-3">
          <div>
            <label className="block text-sm">Họ tên</label>
            <input className="w-full p-2 rounded bg-white/5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Email</label>
            <input className="w-full p-2 rounded bg-white/5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Số điện thoại</label>
            <input className="w-full p-2 rounded bg-white/5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-x-2">
            <button type="submit" className="px-4 py-2 bg-orange-500 rounded">Lưu</button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-600 rounded">Hủy</button>
          </div>
        </form>
      )}
    </div>
  )
}
