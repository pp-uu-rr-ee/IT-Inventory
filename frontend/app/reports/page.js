'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // เพิ่ม useRouter สำหรับการ Redirect
import { 
  BarChart3, 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PackagePlus, 
  PackageMinus,
  PlusSquare
} from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const [inventorySummary, setInventorySummary] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [monthlySummary, setMonthlySummary] = useState({ stockIn: 0, stockOut: 0 })
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false) // State สำหรับตรวจสอบสิทธิ์

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

    const fetchData = async () => {
      try {
        // 1. ดึงสรุปมูลค่าสินค้าปัจจุบัน
        const resInv = await fetch('http://localhost:5000/api/reports/inventory-summary')
        const dataInv = await resInv.json()
        setInventorySummary(Array.isArray(dataInv) ? dataInv : [])

        // 2. ดึงธุรกรรมล่าสุด
        const resTrans = await fetch('http://localhost:5000/api/transactions/recent')
        const dataTrans = await resTrans.json()
        setRecentTransactions(Array.isArray(dataTrans) ? dataTrans : [])

        // 3. ดึงสรุปยอดรวมรายเดือน
        const resMonthly = await fetch('http://localhost:5000/api/transactions/monthly-summary?months=1')
        const dataMonthly = await resMonthly.json()
        setMonthlySummary(dataMonthly)
      } catch (err) {
        console.error("Report Fetch Error:", err)
        setInventorySummary([])
        setRecentTransactions([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  // หากไม่มีสิทธิ์ หรือกำลังโหลด ไม่ต้องแสดงผล UI
  if (!isAuthorized || loading) return <div className="p-8 text-center text-slate-500 font-bold">กำลังตรวจสอบสิทธิ์และโหลดข้อมูล...</div>

  // ตรวจสอบความปลอดภัยก่อนใช้ .reduce
  const totalWarehouseValue = Array.isArray(inventorySummary) 
    ? inventorySummary.reduce((sum, item) => sum + (item.total_value || 0), 0) 
    : 0

  // แยกรายการธุรกรรมล่าสุด (5 รายการแรก)
  const stockInItems = recentTransactions.filter(t => t.type === 'Stock-In').slice(0, 5)
  const stockOutItems = recentTransactions.filter(t => t.type === 'Stock-Out').slice(0, 5)
  
  // รายการสินค้าที่ลงทะเบียนใหม่ล่าสุด
  const newProducts = [...inventorySummary]
    .sort((a, b) => b.product_id - a.product_id)
    .slice(0, 10)

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-blue-600" /> รายงานวิเคราะห์การเคลื่อนไหวและสินค้าใหม่
        </h1>
        <p className="text-slate-500 text-sm italic">ภาพรวมสรุปธุรกรรมล่าสุดและรายการอุปกรณ์ไอทีที่เพิ่มเข้าสู่ระบบ</p>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">มูลค่ารวมคลัง</p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
            <h2 className="text-xl font-black text-slate-900">฿{totalWarehouseValue.toLocaleString()}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-green-600 text-[10px] font-bold uppercase tracking-widest mb-1">นำเข้า (เดือนนี้)</p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ArrowUpCircle className="w-5 h-5" /></div>
            <h2 className="text-xl font-black text-slate-900">+{monthlySummary.stockIn.toLocaleString()}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-orange-600 text-[10px] font-bold uppercase tracking-widest mb-1">เบิกจ่าย (เดือนนี้)</p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ArrowDownCircle className="w-5 h-5" /></div>
            <h2 className="text-xl font-black text-slate-900">-{monthlySummary.stockOut.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      {/* แถวบน: รายการนำเข้า / เบิกจ่าย */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* กล่องนำเข้าล่าสุด */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-green-50/30 flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-slate-700 text-sm uppercase">รายการนำเข้าล่าสุด</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-6 py-3">แบรนด์ / สินค้า</th>
                <th className="px-6 py-3 text-center">จำนวน</th>
                <th className="px-6 py-3 text-right">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-800">
              {stockInItems.map((item) => (
                <tr key={item.transaction_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5">{item.product_code || 'No SKU'}</span>
                    <span className="font-bold text-blue-600 block uppercase text-[10px]">{item.brand}</span>
                    <span className="font-medium text-slate-700">{item.model_name}</span>
                  </td>
                  <td className="px-6 py-3 text-center font-black text-green-600">+{item.quantity}</td>
                  <td className="px-6 py-3 text-right text-slate-400">
                    {new Date(item.transaction_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {stockInItems.length === 0 && (
                <tr><td colSpan="3" className="p-10 text-center text-slate-400 italic">ไม่มีข้อมูลการนำเข้า</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* กล่องเบิกจ่ายล่าสุด */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-orange-50/30 flex items-center gap-2">
            <PackageMinus className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-700 text-sm uppercase">รายการเบิกจ่ายล่าสุด</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-6 py-3">แบรนด์ / สินค้า</th>
                <th className="px-6 py-3 text-center">จำนวน</th>
                <th className="px-6 py-3 text-right">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-800">
              {stockOutItems.map((item) => (
                <tr key={item.transaction_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5">{item.product_code || 'No SKU'}</span>
                    <span className="font-bold text-blue-600 block uppercase text-[10px]">{item.brand}</span>
                    <span className="font-medium text-slate-700">{item.model_name}</span>
                  </td>
                  <td className="px-6 py-3 text-center font-black text-orange-600">-{item.quantity}</td>
                  <td className="px-6 py-3 text-right text-slate-400">
                    {new Date(item.transaction_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {stockOutItems.length === 0 && (
                <tr><td colSpan="3" className="p-10 text-center text-slate-400 italic">ไม่มีข้อมูลการเบิกจ่าย</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* รายการสินค้าลงทะเบียนใหม่ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-blue-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <PlusSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">รายการสินค้าลงทะเบียนใหม่</h3>
              <p className="text-[10px] text-slate-500 font-medium">อุปกรณ์ไอทีล่าสุดที่เพิ่มเข้าสู่ฐานข้อมูลภายใน 1 เดือน</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm border border-blue-100 uppercase tracking-wider">
            New Registry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">รหัสสินค้า</th>
                <th className="px-6 py-4">แบรนด์</th>
                <th className="px-6 py-4">ชื่อสินค้า / รุ่น</th>
                <th className="px-6 py-4 text-center">สต็อกเริ่มต้น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {newProducts.map((item) => (
                <tr key={item.product_id} className="hover:bg-blue-50/20 transition-all duration-200 group">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600/70">
                    {item.product_code || `PID-${String(item.product_id).padStart(3, '0')}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-white text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase border border-slate-200 shadow-sm">
                      {item.brand}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                    {item.model_name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-black text-xs ring-1 ring-slate-200">
                      {item.stock_quantity}
                    </span>
                  </td>
                </tr>
              ))}
              {newProducts.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <PlusSquare className="w-8 h-8 opacity-20" />
                      <p className="italic">ไม่พบข้อมูลการลงทะเบียนสินค้าใหม่ในช่วง 1 เดือนที่ผ่านมา</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}