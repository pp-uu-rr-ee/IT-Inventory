'use client'
import { useEffect, useState, useRef } from 'react'
import { Download, Upload, Package, AlertCircle, CheckCircle2, Search, ChevronDown } from 'lucide-react'

export default function InventoryTransactionForm({ mode }) {
  const isStockIn = mode === 'in'
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // สถานะสำหรับการค้นหาและเลือกสินค้า
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    try {
      const parsedUser = JSON.parse(localStorage.getItem('user'))
      setUser(parsedUser)
    } catch {
      setUser(null)
    }

    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => setProducts([]))

    // คลิกนอก Dropdown ให้ปิด
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ฟิลเตอร์สินค้าตามคำค้นหา (ชื่อรุ่น, แบรนด์ หรือ รหัสสินค้า)
  const filteredProducts = products.filter(p => 
    p.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelectProduct = (product) => {
    setFormData(prev => ({ ...prev, product_id: product.product_id }))
    setSearchTerm(`[${product.brand}] ${product.model_name}`)
    setIsOpen(false)
    setMessage({ type: '', text: '' })
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.product_id) {
      setMessage({ type: 'error', text: 'กรุณาเลือกสินค้าจากการค้นหา' })
      return
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกจำนวนที่มากกว่า 0' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(formData.product_id),
          user_id: user?.id || user?.user_id || 1,
          type: isStockIn ? 'Stock-In' : 'Stock-Out',
          quantity: Number(formData.quantity),
          note: formData.notes
        })
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'เกิดข้อผิดพลาดในการบันทึก')

      setMessage({
        type: 'success',
        text: `บันทึกรายการสำเร็จแล้ว`
      })

      // รีเซ็ตฟอร์ม
      setFormData({ product_id: '', quantity: '', notes: '' })
      setSearchTerm('')
      
      // อัปเดตข้อมูลสินค้าล่าสุด
      fetch('http://localhost:5000/api/products')
        .then(res => res.json())
        .then(data => setProducts(data))
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            {isStockIn ? <Download className="text-blue-600 w-8 h-8" /> : <Upload className="text-orange-500 w-8 h-8" />}
            {isStockIn ? 'นำเข้าสินค้า' : 'เบิกจ่ายสินค้า'}
          </h1>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* ส่วนค้นหาสินค้าแบบกำหนดเอง */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ค้นหาและเลือกสินค้า *</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="พิมพ์รหัสสินค้า, ชื่อรุ่น หรือแบรนด์..."
                  value={searchTerm}
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsOpen(true)
                    if (formData.product_id) setFormData(prev => ({...prev, product_id: ''}))
                  }}
                  className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <ChevronDown className={`absolute right-4 top-3.5 w-5 h-5 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* รายการผลลัพธ์การค้นหา */}
              {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <div
                        key={p.product_id}
                        onClick={() => handleSelectProduct(p)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center group"
                      >
                        <div>
                          <div className="text-xs font-bold text-blue-600 uppercase">{p.brand}</div>
                          <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{p.model_name}</div>
                          {p.product_code && <div className="text-[10px] text-slate-400 font-mono">{p.product_code}</div>}
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock_quantity <= p.min_threshold ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            คงเหลือ: {p.stock_quantity}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-sm italic">ไม่พบสินค้าที่ตรงกับการค้นหา</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {isStockIn ? 'จำนวนที่รับเข้า' : 'จำนวนที่ต้องการเบิก'} *
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                placeholder="0"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">หมายเหตุ</label>
              <textarea
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="ระบุหมายเหตุการทำรายการ..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.product_id}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 ${
                loading || !formData.product_id
                  ? 'bg-slate-300 cursor-not-allowed'
                  : isStockIn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {loading ? 'กำลังบันทึก...' : (isStockIn ? 'ยืนยันนำเข้าสินค้า' : 'ยืนยันการเบิกจ่าย')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}