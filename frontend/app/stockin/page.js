'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import InventoryTransactionForm from '@/components/InventoryTransactionForm'

export default function StockInPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || user.role === 'Warehouse Manager') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Warehouse Staff เท่านั้น')
      router.replace('/dashboard')
      return
    }
    setIsAuthorized(true)
  }, [router])

  if (!isAuthorized) {
    return <div className="p-8 text-center text-slate-500 font-bold">กำลังตรวจสอบสิทธิ์...</div>
  }

  return <InventoryTransactionForm mode="in" />
}
