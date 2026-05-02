'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // เพิ่ม useRouter สำหรับการ Redirect
import { AlertTriangle, Package, ArrowRight } from 'lucide-react'

export default function LowStockPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false) // State สำหรับตรวจสอบสิทธิ์

  const fetchLowStock = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/low-stock')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // --- เริ่มส่วนตรวจสอบ Role ---
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || user.role !== 'Warehouse Manager') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Warehouse Manager เท่านั้น')
      router.replace('/products')
      return
    }
    setIsAuthorized(true)
    // --- จบส่วนตรวจสอบ Role ---

    fetchLowStock()
  }, [router])

  // หากไม่มีสิทธิ์ หรือกำลังโหลด ไม่ต้องแสดงผล UI
  if (!isAuthorized || loading) return <div className="p-8 text-center text-slate-500 font-bold">กำลังตรวจสอบสิทธิ์...</div>

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          สินค้าใกล้หมด
        </h1>
        <p className="text-slate-500 text-sm">รายการสินค้าที่ต่ำกว่าจำนวนขั้นต่ำที่กำหนดไว้ในระบบ</p>
      </div>

      {/* Alert Card */}
      <div className="mb-6 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span className="font-bold text-lg">{items.length} รายการ ต้องสั่งซื้อเพิ่ม</span>
        </div>
        <p className="text-slate-500 text-sm ml-8">กรุณาตรวจสอบและดำเนินการเติมสินค้าเข้าคลังเพื่อป้องกันสินค้าขาดแคลน</p>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4 font-semibold">รหัสสินค้า</th>
              <th className="px-6 py-4 font-semibold">ชื่อสินค้า</th>
              <th className="px-6 py-4 font-semibold text-center">หมวดหมู่</th>
              <th className="px-6 py-4 font-semibold text-center">คงเหลือ</th>
              <th className="px-6 py-4 font-semibold text-center">ขั้นต่ำ</th>
              <th className="px-6 py-4 font-semibold text-center">ต้องเติม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.product_id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-slate-400">
                  {String(item.product_code).padStart(4, '0')}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-700">{item.model_name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{item.brand}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                    {item.category_name || 'ทั่วไป'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm shadow-red-200">
                    {item.stock_quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-slate-400 text-sm font-medium">
                  {item.min_threshold}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600 font-black">
                    <ArrowRight className="w-3 h-3" />
                    {item.min_threshold - item.stock_quantity + 1}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && !loading && (
          <div className="py-20 text-center text-slate-400 italic">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
            ไม่มีสินค้าที่ต่ำกว่าเกณฑ์ในขณะนี้
          </div>
        )}
      </div>
    </div>
  )
}