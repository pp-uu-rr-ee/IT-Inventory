'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // เพิ่ม Link สำหรับไปหน้า Register

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getDefaultPathByRole = (role) => {
    return role === 'Warehouse Manager' ? '/dashboard' : '/products'
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push(getDefaultPathByRole(data.user?.role))
      } else {
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    // ปรับพื้นหลังเป็น Gradient ให้ดูพรีเมียมขึ้น
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-black px-4">
      <div className="w-full max-w-md">
        
        {/* Card คลุม Form */}
        <form 
          onSubmit={handleLogin} 
          className="p-10 bg-white shadow-2xl rounded-2xl border border-white/20 backdrop-blur-sm"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              WMS System
            </h2>
            <p className="text-gray-500 mt-2">กรุณาเข้าสู่ระบบเพื่อจัดการคลังสินค้า</p>
          </div>
          
          {/* ส่วนแสดง Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                placeholder="admin@warehouse.com" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className={`w-full mt-8 py-3 rounded-xl text-white font-bold text-lg shadow-lg transform active:scale-95 transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/50'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
                กำลังตรวจสอบ...
              </span>
            ) : 'เข้าสู่ระบบ'}
          </button>

          {/* ฟุตเตอร์ของ Form: ลิงก์ไปหน้า Register */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600 text-sm">
              ยังไม่มีบัญชีผู้ใช้งาน?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 font-bold hover:underline hover:text-blue-800 transition-colors"
              >
                สมัครสมาชิกใหม่ที่นี่
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-white/60 text-xs mt-6">
          © 2026 Warehouse Management System. 65070183&65070248
        </p>
      </div>
    </div>
  )
}