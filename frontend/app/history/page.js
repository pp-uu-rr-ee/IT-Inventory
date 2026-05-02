'use client'
import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm.trim()) params.set('search', searchTerm.trim())
        if (typeFilter !== 'all') params.set('type', typeFilter)

        const query = params.toString()
        const response = await fetch(`http://localhost:5000/api/transactions/history${query ? `?${query}` : ''}`)
        const payload = await response.json()
        setTransactions(Array.isArray(payload) ? payload : [])
      } catch (error) {
        console.error('Fetch history failed:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchTransactions, 250)
    return () => clearTimeout(debounce)
  }, [searchTerm, typeFilter])

  const rows = useMemo(() => {
    return transactions.map((item) => ({
      id: item.transaction_id,
      date: new Date(item.transaction_date).toISOString().slice(0, 10),
      product: item.model_name,
      type: item.type,
      quantity: item.quantity,
      operator: item.operator_name || '-',
      note: item.notes || '-',
    }))
  }, [transactions])

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ประวัติการเคลื่อนไหว</h1>
        <p className="text-slate-500 text-base">บันทึกการนำเข้าและเบิกจ่ายทั้งหมด</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ค้นหาสินค้า, ผู้ดำเนินการ..."
              className="w-full h-11 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="border border-slate-200 p-2 rounded-lg outline-none bg-white text-slate-900 min-w-[180px] cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="Stock-In">นำเข้า</option>
            <option value="Stock-Out">เบิกจ่าย</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="px-4 py-3 font-semibold">วันที่</th>
              <th className="px-4 py-3 font-semibold">สินค้า</th>
              <th className="px-4 py-3 font-semibold">ประเภท</th>
              <th className="px-4 py-3 font-semibold text-right">จำนวน</th>
              <th className="px-4 py-3 font-semibold">ผู้ดำเนินการ</th>
              <th className="px-4 py-3 font-semibold">แผนก/หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3 text-slate-500">{row.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{row.product}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    row.type === 'Stock-In' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {row.type === 'Stock-In' ? 'นำเข้า' : 'เบิกจ่าย'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">{row.quantity}</td>
                <td className="px-4 py-3">{row.operator}</td>
                <td className="px-4 py-3 text-slate-500">{row.note}</td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 italic">ไม่มีประวัติการเคลื่อนไหว</td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
