'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, DollarSign, AlertTriangle, ArrowRightLeft, PlusSquare, History } from 'lucide-react'

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between border border-gray-100">
      <div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
      <div>{icon}</div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [lowStock, setLowStock] = useState([])
  const [user, setUser] = useState(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowCount: 0,
    transactionsToday: 0
  })
  const [recentMovements, setRecentMovements] = useState([])
  // เพิ่ม newItems ใน State นี้
  const [monthlyMovement, setMonthlyMovement] = useState({ stockIn: 0, stockOut: 0, newItems: 0 })
  const [categoryBreakdown, setCategoryBreakdown] = useState([])

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('user'))
      if (!parsed || parsed.role !== 'Warehouse Manager') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Warehouse Manager เท่านั้น')
        router.replace('/products')
        return
      }
      setUser(parsed)
      setIsAuthorized(true)
    } catch {
      setUser(null)
      router.replace('/login')
      return
    }

    fetch('http://localhost:5000/api/notifications/low-stock')
      .then(res => res.json())
      .then(data => setLowStock(data))
      .catch(() => setLowStock([]))

    fetch('http://localhost:5000/api/notifications/summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(() => setSummary({ totalProducts: 0, totalValue: 0, lowCount: 0, transactionsToday: 0 }))

    // แก้ไข: ดึงข้อมูลธุรกรรม และ สินค้าใหม่มาผสมกันในรายการเคลื่อนไหว
    const fetchAllActivities = async () => {
      try {
        const resTrans = await fetch('http://localhost:5000/api/transactions/recent')
        const dataTrans = await resTrans.json()
        
        const resNew = await fetch('http://localhost:5000/api/reports/inventory-summary')
        const dataNew = await resNew.json()

        // แปลงข้อมูลธุรกรรม
        const mappedTrans = dataTrans.map(item => ({
          id: `t-${item.transaction_id}`,
          name: item.model_name,
          type: item.type === 'Stock-In' ? 'นำเข้า' : 'เบิกจ่าย',
          qty: item.quantity,
          date: item.transaction_date?.split('T')[0] || '-',
          rawDate: new Date(item.transaction_date)
        }))

        // แปลงข้อมูลสินค้าใหม่ (เป็นประเภท "ลงทะเบียน")
        const mappedNew = (Array.isArray(dataNew) ? dataNew : []).map(item => ({
          id: `n-${item.product_id}`,
          name: item.model_name,
          type: 'ลงทะเบียน',
          qty: item.stock_quantity,
          date: item.created_at ? item.created_at.split(' ')[0] : '-',
          rawDate: new Date(item.created_at)
        }))

        // รวมกันและเรียงตามวันที่ล่าสุด
        const combined = [...mappedTrans, ...mappedNew]
          .sort((a, b) => b.rawDate - a.rawDate)
          .slice(0, 5)

        setRecentMovements(combined)

        // อัปเดตตัวเลขกราฟเปรียบเทียบ (เพิ่มจำนวนสินค้าใหม่รอบเดือน)
        setMonthlyMovement(prev => ({
          ...prev,
          newItems: mappedNew.length 
        }))
      } catch (err) {
        console.error(err)
      }
    }
    fetchAllActivities()

    fetch('http://localhost:5000/api/transactions/monthly-summary?months=1')
      .then(res => res.json())
      .then(data => setMonthlyMovement(prev => ({
        ...prev,
        stockIn: Number(data.stockIn || 0),
        stockOut: Number(data.stockOut || 0)
      })))

    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        const grouped = data.reduce((acc, item) => {
          const categoryName = item.category_name || 'อื่นๆ'
          const stockQuantity = Number(item.stock_quantity || 0)
          acc[categoryName] = (acc[categoryName] || 0) + stockQuantity
          return acc
        }, {})
        const palette = ['#0062ff', '#f59e0b', '#00cf34', '#e40000', '#ae00ff', '#73ff00', '#ff51e8', '#000000']
        const entries = Object.entries(grouped).map(([name, value], index) => ({
          name, value, color: palette[index % palette.length]
        })).filter(item => item.value > 0)
        setCategoryBreakdown(entries)
      })
  }, [router])

  if (!isAuthorized) {
    return <div className="p-8 text-center text-slate-500 font-bold">กำลังตรวจสอบสิทธิ์...</div>
  }

  // คำนวณค่าสูงสุดเพื่อทำ Scale ของกราฟ
  const maxMovement = Math.max(monthlyMovement.stockIn, monthlyMovement.stockOut, monthlyMovement.newItems, 1)
  const totalCategoryStock = categoryBreakdown.reduce((sum, item) => sum + item.value, 0)

  const pieGradient = totalCategoryStock > 0
    ? (() => {
        let currentPercent = 0
        const segments = categoryBreakdown.map(item => {
          const segmentPercent = (item.value / totalCategoryStock) * 100
          const start = currentPercent
          currentPercent += segmentPercent
          return `${item.color} ${start}% ${currentPercent}%`
        })
        return `conic-gradient(${segments.join(', ')})`
      })()
    : 'conic-gradient(#e5e7eb 0% 100%)'

  return (
    <div className="p-6 bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 uppercase italic tracking-tighter">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500">ระบบติดตามความเคลื่อนไหวคลังอุปกรณ์ไอที</p>
        </div>
        <div className="text-right border-l-2 border-blue-600 pl-4">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Operator</div>
          <div className="font-bold text-gray-800">{user?.fullname || user?.name || 'ผู้ดูแลระบบ'}</div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="สินค้าทั้งหมด" value={`${summary.totalProducts} รายการ`} icon={<Package className="w-7 h-7 text-blue-500" />} />
        <StatCard title="มูลค่าสต็อกรวม" value={`${Number(summary.totalValue || 0).toLocaleString()} ฿`} icon={<DollarSign className="w-7 h-7 text-green-500" />} />
        <StatCard title="สินค้าใกล้หมด" value={`${summary.lowCount} รายการ`} icon={<AlertTriangle className="w-7 h-7 text-red-500" />} />
        <StatCard title="ธุรกรรมวันนี้" value={`${summary.transactionsToday} รายการ`} icon={<ArrowRightLeft className="w-7 h-7 text-yellow-500" />} />
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* กราฟเปรียบเทียบธุรกรรม (เพิ่มสินค้าใหม่) */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6 flex flex-col border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" /> สรุปกิจกรรมรอบเดือน (30 วันล่าสุด)
          </h2>
          <div className="space-y-6">
            {/* นำเข้า */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-blue-600 uppercase">Stock-In (นำเข้า)</span>
                <span>{monthlyMovement.stockIn} ชิ้น</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(monthlyMovement.stockIn / maxMovement) * 100}%` }} />
              </div>
            </div>
            {/* เบิกจ่าย */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-orange-500 uppercase">Stock-Out (เบิกจ่าย)</span>
                <span>{monthlyMovement.stockOut} ชิ้น</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${(monthlyMovement.stockOut / maxMovement) * 100}%` }} />
              </div>
            </div>
            {/* สินค้าลงทะเบียนใหม่ */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-purple-600 uppercase">New Products (สินค้าใหม่)</span>
                <span>{monthlyMovement.newItems} รายการ</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${(monthlyMovement.newItems / maxMovement) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* สัดส่วนหมวดหมู่ */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">สัดส่วนตามหมวดหมู่</h3>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full shadow-inner ring-4 ring-white mb-6" style={{ background: pieGradient }} />
            <div className="w-full space-y-2 max-h-32 overflow-auto pr-2 text-[11px]">
              {categoryBreakdown.map(item => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 font-medium group-hover:text-blue-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-400">{(totalCategoryStock > 0 ? (item.value / totalCategoryStock * 100).toFixed(1) : 0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* แจ้งเตือนสินค้าใกล้หมด */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
              สินค้าที่ต้องสั่งเพิ่ม <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded">Low Stock</span>
            </h4>
            <div className="space-y-3 overflow-auto max-h-64 pr-2">
              {lowStock.map(item => (
                <div key={item.product_id} className="flex justify-between items-center p-2 hover:bg-red-50/50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{item.model_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono italic">SKU: {item.product_code || 'N/A'}</div>
                  </div>
                  <div className="text-sm font-black text-red-600">{item.stock_quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ตารางเคลื่อนไหวล่าสุด (รวมทั้งธุรกรรมและสินค้าใหม่) */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 overflow-hidden">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" /> ไทม์ไลน์กิจกรรมล่าสุด
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-50 uppercase font-bold text-[9px] tracking-widest">
                    <th className="pb-3">รายการสินค้า</th>
                    <th className="pb-3">กิจกรรม</th>
                    <th className="pb-3 text-center">จำนวน</th>
                    <th className="pb-3 text-right">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentMovements.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="py-3 font-bold text-gray-800 group-hover:text-blue-600">{row.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          row.type === 'นำเข้า' ? 'bg-blue-100 text-blue-700' : 
                          row.type === 'เบิกจ่าย' ? 'bg-orange-100 text-orange-700' : 
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 text-center font-black text-gray-700">{row.qty}</td>
                      <td className="py-3 text-right text-gray-400 font-mono text-[10px]">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}