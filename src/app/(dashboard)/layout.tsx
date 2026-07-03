import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-dark)] print:bg-white overflow-hidden print:overflow-visible print:h-auto">
      <div className="print:hidden">
        <Sidebar userRol={session.user.rol} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header user={session.user} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}
