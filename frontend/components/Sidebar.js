'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Monitor, 
  LayoutDashboard, 
  Boxes, 
  PlusCircle, 
  Download, 
  Upload, 
  History,
  LogOut, 
  AlertCircle, 
  BarChart3 
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState({ fullname: 'Loading...', email: '', role: '' })
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      const userId = parsedUser.id || parsedUser.user_id 
      
      if (userId) {
        fetch(`http://localhost:5000/api/users/${userId}`)
          .then(res => res.json())
          .then(data => { if (!data.error) setUser(data) })
          .catch(err => console.error("Failed to fetch user:", err))
      }
    }

    const fetchLowStockCount = () => {
      fetch('http://localhost:5000/api/notifications/summary')
        .then(res => res.json())
        .then(data => setLowStockCount(data.lowCount || 0))
        .catch(err => console.error("Failed to fetch summary:", err))
    }

    fetchLowStockCount()
    const interval = setInterval(fetchLowStockCount, 30000) 
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  // ตรวจสอบว่าเป็น Manager หรือไม่
  const isManager = user.role === 'Warehouse Manager';

  // สร้างรายการเมนูโดยใช้เงื่อนไขกรองตามสิทธิ์
  const menuGroups = [
    {
      title: "เมนูหลัก",
      items: [
        // Staff จะไม่เห็น แดชบอร์ด
        ...(isManager ? [{ name: 'แดชบอร์ด', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> }] : []),
        { name: 'สินค้าทั้งหมด', href: '/products', icon: <Boxes className="w-5 h-5" /> },
        // Staff จะไม่เห็น ลงทะเบียนสินค้าใหม่
        ...(isManager ? [{ name: 'ลงทะเบียนสินค้าใหม่', href: '/products/add', icon: <PlusCircle className="w-5 h-5" /> }] : []),
      ]
    },
    {
      title: "จัดการสต็อก",
      items: [
        ...(!isManager ? [
          { name: 'นำเข้าสินค้า', href: '/stockin', icon: <Download className="w-5 h-5" /> },
          { name: 'เบิกจ่ายสินค้า', href: '/stockout', icon: <Upload className="w-5 h-5" /> },
        ] : []),
        { name: 'ประวัติการเคลื่อนไหว', href: '/history', icon: <History className="w-5 h-5" /> },
      ]
    },
    {
      title: "ข้อมูลเพิ่มเติม",
      items: [
        // Staff จะไม่เห็น รายงานสรุป และ สินค้าใกล้หมด
        ...(isManager ? [
          { name: 'รายงานสรุป', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
          { 
            name: 'สินค้าใกล้หมด', 
            href: '/low-stock', 
            icon: <AlertCircle className="w-5 h-5" />, 
            badge: lowStockCount 
          },
        ] : []),
      ]
    }
  ].filter(group => group.items.length > 0); // กรองกลุ่มเมนูที่ไม่มีรายการข้างในออก

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shadow-xl font-sans">
      <div className="p-6">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Monitor className="w-5 h-5" />
          </span>
          IT Inventory
        </h2>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">ระบบจัดการคลังอุปกรณ์</p>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h3 className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    pathname === item.href 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={`${pathname === item.href ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium flex-1 text-sm">{item.name}</span>
                  
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-800 text-sm">
            {user.fullname ? user.fullname[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.fullname}</p>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-slate-500 hover:text-red-400 transition-all hover:scale-110 p-1"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" /> 
          </button>
        </div>
      </div>
    </div>
  )
}