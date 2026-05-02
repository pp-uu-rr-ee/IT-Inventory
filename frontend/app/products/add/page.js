'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PackagePlus, ArrowLeft, Save, Info, ChevronDown, Hash, Search, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default function AddProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false) // เพิ่มเพื่อเช็คสิทธิ์

  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const catRef = useRef(null)
  const brandRef = useRef(null)

  const [formData, setFormData] = useState({
    product_code: '',
    model_name: '',
    brand: '',
    category_id: '',
    category_name: '',
    description: '',
    price: '',
    stock_quantity: '',
    min_threshold: 5
  })

  useEffect(() => {
    
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || user.role !== 'Warehouse Manager') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Warehouse Manager เท่านั้น')
      router.push('/products')
      return
    }
    setIsAuthorized(true)
    

    const fetchData = async () => {
      try {
        const catRes = await fetch('http://localhost:5000/api/categories')
        const catData = await catRes.json()
        setCategories(catData)

        const prodRes = await fetch('http://localhost:5000/api/products')
        const prodData = await prodRes.json()
        const uniqueBrands = [...new Set(prodData.map(p => p.brand))].filter(b => b)
        setBrands(uniqueBrands)
      } catch (err) {
        console.error("Fetch error:", err)
      }
    }
    fetchData()

    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setShowCatDropdown(false)
      if (brandRef.current && !brandRef.current.contains(e.target)) setShowBrandDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ส่ง user_id แนบไปใน Header เพื่อให้ Backend ตรวจสอบสิทธิ์อีกชั้น
      const user = JSON.parse(localStorage.getItem('user'))
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id // ส่ง ID ไปตรวจสอบที่ Backend
        },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (res.ok) {
        alert('บันทึกสินค้าเรียบร้อยแล้ว!')
        router.push('/products')
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  // ป้องกันการเห็น UI ชั่วขณะก่อน Redirect
  if (!isAuthorized) return null

  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(formData.category_name.toLowerCase())
  )
  const filteredBrands = brands.filter(b => 
    b.toLowerCase().includes(formData.brand.toLowerCase())
  )

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <PackagePlus className="text-blue-600 w-8 h-8" /> ลงทะเบียนสินค้าใหม่
            </h1>
            <p className="text-slate-500 mt-1">กำหนดรหัสสินค้าและข้อมูลพื้นฐานเข้าระบบ</p>
          </div>
          <Link href="/products" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" /> กลับหน้าคลังสินค้า
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                  <Hash className="w-3 h-3" /> รหัสสินค้า (SKU) *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="เช่น CPU-001"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  value={formData.product_code}
                  onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ชื่อโมเดลสินค้า *</label>
                <input 
                  required
                  type="text"
                  placeholder="เช่น Intel Core i9-14900K"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.model_name}
                  onChange={(e) => setFormData({...formData, model_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 relative" ref={brandRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">แบรนด์ *</label>
                <div className="relative">
                  <input 
                    required
                    type="text"
                    placeholder="พิมพ์เพื่อค้นหาหรือระบุแบรนด์ใหม่..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.brand}
                    onFocus={() => setShowBrandDropdown(true)}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                  <ChevronDown className={`absolute right-4 top-3.5 w-5 h-5 text-slate-300 transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`} />
                </div>
                {showBrandDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredBrands.map((b, i) => (
                      <div 
                        key={i} 
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-medium"
                        onClick={() => {
                          setFormData({...formData, brand: b})
                          setShowBrandDropdown(false)
                        }}
                      >
                        {b}
                      </div>
                    ))}
                    {formData.brand && !brands.includes(formData.brand) && (
                      <div className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-2">
                        <PlusCircle className="w-3 h-3" /> เพิ่มแบรนด์ใหม่: "{formData.brand}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative" ref={catRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">หมวดหมู่สินค้า *</label>
                <div className="relative">
                  <input 
                    required
                    type="text"
                    placeholder="พิมพ์เพื่อเลือกหมวดหมู่..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.category_name}
                    onFocus={() => setShowCatDropdown(true)}
                    onChange={(e) => setFormData({...formData, category_name: e.target.value, category_id: ''})}
                  />
                  <ChevronDown className={`absolute right-4 top-3.5 w-5 h-5 text-slate-300 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} />
                </div>
                {showCatDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredCategories.map((c) => (
                      <div 
                        key={c.category_id} 
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-medium border-b border-slate-50 last:border-none"
                        onClick={() => {
                          setFormData({...formData, category_id: c.category_id, category_name: c.category_name})
                          setShowCatDropdown(false)
                        }}
                      >
                        {c.category_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ราคาประมานการ (฿)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">สต็อกเริ่มต้น / จุดแจ้งเตือน</label>
                <div className="flex gap-4">
                  <input 
                    type="number"
                    placeholder="สต็อก"
                    className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  />
                  <input 
                    type="number"
                    placeholder="จุดเตือน"
                    className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({...formData, min_threshold: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">รายละเอียดสินค้า</label>
              <textarea 
                rows="2"
                placeholder="ระบุสเปคหรือคำอธิบาย..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="bg-slate-50 px-8 py-6 flex justify-end gap-4 border-t border-slate-100">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
            <button 
              disabled={loading}
              type="submit"
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}