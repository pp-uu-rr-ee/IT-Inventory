'use client'
import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, ArrowLeft, Save, Hash, PlusCircle, ChevronDown, Info } from 'lucide-react'
import Link from 'next/link'

export default function EditProductPage({ params }) {
  const router = useRouter()
  const { id } = use(params) 

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

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
    // --- 1. ตรวจสอบสิทธิ์ (Warehouse Manager เท่านั้น) ---
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Warehouse Manager') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Warehouse Manager เท่านั้น');
        router.replace('/products');
        return;
    }
    setIsAuthorized(true);

    const fetchData = async () => {
      try {
        // ดึงข้อมูล Categories
        const catRes = await fetch('http://localhost:5000/api/categories').then(res => res.json())
        setCategories(catRes)
        
        // ดึงแบรนด์ทั้งหมดมาทำ List
        const prodAllRes = await fetch('http://localhost:5000/api/products').then(res => res.json())
        setBrands([...new Set(prodAllRes.map(p => p.brand))].filter(b => b))
        
        // ดึงรายละเอียดสินค้าที่ต้องการแก้ไข
        const res = await fetch(`http://localhost:5000/api/products-detail/${id}`)
        const data = await res.json()
        if (data) {
            setFormData({ 
                ...data, 
                category_name: data.category_name || '',
                description: data.description || '', // เพิ่ม field ที่อาจจะหาย
                price: data.price || '',
                stock_quantity: data.stock_quantity || '0',
                min_threshold: data.min_threshold || 5
            })
        }
      } catch (err) { 
        console.error(err);
        router.push('/products') 
      }
      finally { setLoading(false) }
    }
    fetchData()

    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setShowCatDropdown(false)
      if (brandRef.current && !brandRef.current.contains(e.target)) setShowBrandDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [id, router])

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setSaving(true)
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id // ส่ง ID เพื่อตรวจสอบที่ Backend
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) { 
        alert('อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว!'); 
        router.push('/products'); 
      } else {
        const errData = await res.json()
        alert(errData.error || 'เกิดข้อผิดพลาด')
      }
    } catch { 
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้') 
    }
    finally { setSaving(false) }
  }

  if (!isAuthorized || loading) return <div className="p-8 text-center text-slate-500 font-bold">กำลังโหลดข้อมูล...</div>

  const filteredCategories = categories.filter(c => (c.category_name || '').toLowerCase().includes((formData.category_name || '').toLowerCase()))
  const filteredBrands = brands.filter(b => (b || '').toLowerCase().includes((formData.brand || '').toLowerCase()))

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="text-amber-600 w-8 h-8" /> แก้ไขข้อมูลสินค้า
            </h1>
            <p className="text-slate-500 mt-1">ปรับปรุงรายละเอียดสินค้าในคลัง</p>
          </div>
          <Link href="/products" className="text-blue-600 hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> กลับคลังสินค้า
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* รหัสสินค้า และ ชื่อโมเดล */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                  <Hash className="w-3 h-3" /> SKU (ไม่สามารถเปลี่ยนได้)
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono outline-none cursor-not-allowed" 
                  value={formData.product_code} 
                  readOnly 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ชื่อโมเดลสินค้า *</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.model_name} 
                  onChange={(e) => setFormData({...formData, model_name: e.target.value})} 
                />
              </div>
            </div>

            {/* แบรนด์ และ หมวดหมู่ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 relative" ref={brandRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">แบรนด์ *</label>
                <div className="relative">
                  <input 
                    required 
                    type="text" 
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
                        onClick={() => { setFormData({...formData, brand: b}); setShowBrandDropdown(false); }}
                      >
                        {b}
                      </div>
                    ))}
                    {formData.brand && !brands.includes(formData.brand) && (
                      <div className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-2">
                        <PlusCircle className="w-3 h-3" /> ใช้แบรนด์ใหม่: "{formData.brand}"
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
                        onClick={() => { setFormData({...formData, category_id: c.category_id, category_name: c.category_name}); setShowCatDropdown(false); }}
                      >
                        {c.category_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ราคา และ สต็อก */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ราคา (฿)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">สต็อกปัจจุบัน / จุดแจ้งเตือน</label>
                <div className="flex gap-4">
                  <input 
                    type="number" 
                    className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed" 
                    value={formData.stock_quantity} 
                    readOnly 
                    title="แก้ไขสต็อกได้จากเมนู รับเข้า/จ่ายออก เท่านั้น"
                  />
                  <input 
                    type="number" 
                    className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.min_threshold} 
                    onChange={(e) => setFormData({...formData, min_threshold: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* รายละเอียดสินค้า */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">รายละเอียดสินค้า</label>
              <textarea 
                rows="3"
                placeholder="ระบุสเปคหรือคำอธิบาย..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bg-slate-50 px-8 py-6 flex justify-end gap-4 border-t border-slate-100">
            <button 
                type="button" 
                onClick={() => router.back()} 
                className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-200 transition-all"
            >
                ยกเลิก
            </button>
            <button 
                disabled={saving} 
                type="submit" 
                className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-700 shadow-sm">
           <Info className="w-5 h-5 flex-shrink-0" />
           <p className="text-xs leading-relaxed">
             <b>หมายเหตุ:</b> ไม่สามารถแก้ไขรหัสสินค้า (SKU) และจำนวนสต็อกโดยตรงได้ หากต้องการปรับปรุงสต็อก กรุณาทำรายการผ่านเมนู <b>"บันทึกรับ/จ่ายสินค้า"</b>
           </p>
        </div>
      </div>
    </div>
  )
}