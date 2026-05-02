'use client'
import { useSearchParams } from 'next/navigation'
import InventoryTransactionForm from '@/components/InventoryTransactionForm'

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') === 'out' ? 'out' : 'in'
  return <InventoryTransactionForm mode={type} />
}
