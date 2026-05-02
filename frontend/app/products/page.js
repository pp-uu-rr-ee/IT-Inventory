'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Eye, Edit2, Trash2, Plus, Hash } from 'lucide-react'
import Link from 'next/link'

export default function ProductList() {
    const router = useRouter()
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('all');
    const [user, setUser] = useState(null);

    useEffect(() => {
        // ดึงข้อมูล User มาเช็คสิทธิ์
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setUser(storedUser);
        } catch (e) { setUser(null); }

        fetch('http://localhost:5000/api/categories')
            .then(res => res.json())
            .then(setCategories)
            .catch(err => console.error(err));
        
        fetchProducts();
    }, [search, selectedCat]);

    const isManager = user?.role === 'Warehouse Manager';

    const fetchProducts = () => {
        const query = new URLSearchParams({ search, category: selectedCat }).toString();
        fetch(`http://localhost:5000/api/products?${query}`)
            .then(res => res.json())
            .then(data => {
                const sortedData = [...data].sort((a, b) => 
                    (a.product_code || "").localeCompare(b.product_code || "")
                );
                setProducts(sortedData);
            })
            .catch(err => console.error(err));
    };

    const handleViewDetails = (product) => {
        alert(`รายละเอียดสินค้า:\nรหัส: ${product.product_code}\nรุ่น: ${product.model_name}\nแบรนด์: ${product.brand}\nราคา: ฿${product.price}\nคำอธิบาย: ${product.description || 'ไม่มีข้อมูล'}\nคงเหลือ: ${product.stock_quantity}\nควรมี: ${product.min_threshold}`);
    };

    const handleEdit = (productId) => {
        router.push(`/products/edit/${productId}`);
    };

    const handleDelete = async (productId, productName) => {
        if (confirm(`คุณมั่นใจหรือไม่ที่จะลบสินค้า "${productName}"? \nการลบนี้จะไม่สามารถย้อนกลับได้`)) {
            try {
                const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    alert('ลบสินค้าสำเร็จ');
                    fetchProducts();
                } else {
                    const errorData = await res.json();
                    alert(errorData.error || 'ไม่สามารถลบได้');
                }
            } catch (err) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen text-slate-700 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">คลังสินค้าทั้งหมด</h1>
                    <p className="text-sm text-slate-500">จัดการรายการอุปกรณ์ไอที ({products.length} รายการ)</p>
                </div>
                {/* เพิ่มการเช็คสิทธิ์ปุ่มลงทะเบียน */}
                {isManager && (
                    <Link href="/products/add" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg font-bold text-sm">
                        <Plus className="w-4 h-4" /> ลงทะเบียนสินค้าใหม่
                    </Link>
                )}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-4 items-center border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหารหัสสินค้า, ชื่อรุ่น, แบรนด์..." 
                        className="w-full h-11 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select 
                    className="border border-slate-200 p-2 rounded-lg outline-none bg-white text-slate-900 min-w-[180px] cursor-pointer"
                    onChange={(e) => setSelectedCat(e.target.value)}
                >
                    <option value="all">ทุกหมวดหมู่สินค้า</option>
                    {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-slate-900">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                        <tr>
                            <th className="p-4 pl-6 text-blue-600"><div className="flex items-center gap-1"><Hash className="w-3 h-3" /> รหัสสินค้า</div></th>
                            <th className="p-4">แบรนด์</th>
                            <th className="p-4">ชื่อรุ่น / รายละเอียด</th>
                            <th className="p-4 text-center">หมวดหมู่</th>
                            <th className="p-4 text-right">ราคาประมานการ</th>
                            <th className="p-4 text-center">คงเหลือ</th>
                            <th className="p-4 text-center pr-6">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                        {products.map((p) => (
                            <tr key={p.product_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4 pl-6 font-mono text-xs font-bold text-blue-600">
                                    {p.product_code || 'N/A'}
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200">
                                        {p.brand}
                                    </span>
                                </td>
                                <td className="p-4 font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                                    {p.model_name}
                                </td>
                                <td className="p-4 text-center text-xs text-slate-500 font-medium">
                                    {p.category_name}
                                </td>
                                <td className="p-4 text-right font-bold text-slate-600">
                                    ฿{Number(p.price).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ring-2 ring-offset-1 ${
                                        p.stock_quantity <= p.min_threshold 
                                        ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-700'
                                    }`}>
                                        {p.stock_quantity}
                                    </span>
                                </td>
                                <td className="p-4 text-center space-x-2 pr-6">
                                    <button onClick={() => handleViewDetails(p)} className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                    
                                    {/* เพิ่มการเช็คสิทธิ์ปุ่มแก้ไขและลบ */}
                                    {isManager && (
                                        <>
                                            <button onClick={() => handleEdit(p.product_id)} className="p-1.5 hover:bg-amber-50 text-slate-300 hover:text-amber-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(p.product_id, p.model_name)} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}