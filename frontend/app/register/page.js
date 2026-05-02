'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'Warehouse Staff'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        // เมื่อสมัครสำเร็จ ส่งไปหน้า login พร้อม query string เพื่อแจ้งเตือน
        router.push('/login?registered=true')
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-500 text-black px-4 py-12">
      <div className="w-full max-w-lg">
        
        <form 
          onSubmit={handleSubmit} 
          className="p-10 bg-white shadow-2xl rounded-3xl border border-white/20 transition-all"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
              Create Account
            </h2>
            <p className="text-gray-500 mt-2 font-medium">เข้าร่วมเป็นส่วนหนึ่งของระบบจัดการคลังสินค้า</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {/* Fullname */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">ชื่อ-นามสกุล</label>
              <input 
                type="text" 
                required
                placeholder="สมชาย สายลุย"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" 
                onChange={e => setFormData({...formData, fullname: e.target.value})} 
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">อีเมล</label>
              <input 
                type="email" 
                required
                placeholder="name@company.com"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">รหัสผ่าน</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            {/* Role Selection (Fixed Dropdown) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                ตำแหน่งหน้าที่
              </label>
              
              <div className="relative group">
                <select 
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer font-medium text-gray-700 pr-10"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Warehouse Staff">👤 พนักงานคลังสินค้า (Staff)</option>
                  <option value="Warehouse Manager">🔑 ผู้จัดการคลังสินค้า (Manager)</option>
                </select>
                
                {/* Custom Arrow Icon */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none group-focus-within:text-indigo-600 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-focus-within:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full mt-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl transform active:scale-95 transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-500/50'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                กำลังลงทะเบียน...
              </span>
            ) : 'สร้างบัญชีผู้ใช้งาน'}
          </button>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 font-medium">
              เป็นสมาชิกอยู่แล้ว?{' '}
              <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors underline-offset-4 hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-white/60 text-xs mt-6">
          WMS System v2.0 • Secured Registration
        </p>
      </div>
    </div>
  )
}