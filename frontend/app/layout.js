'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NavBar from '@/components/NavBar'
// import './globals.css' // ถ้าคุณลบไฟล์นี้ออก หรือไม่ใช้ npm install แล้ว ให้ Comment ไว้ครับ

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const authPages = ['/login', '/register']
  const isAuthPage = authPages.includes(pathname)
  const [showSidebar, setShowSidebar] = React.useState(true)

  const toggleSidebar = () => setShowSidebar(prev => !prev)

  return (
    <html lang="th">
      <head>
        
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        

      </head>
      <body className="bg-gray-50 text-slate-900">
        <div className="flex min-h-screen">
          {!isAuthPage && showSidebar && <Sidebar />}

          <main className={`flex-1 flex flex-col ${isAuthPage ? 'w-full' : 'overflow-y-auto'}`}>
            {!isAuthPage && <NavBar onToggleSidebar={toggleSidebar} />}
            <div className="">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}