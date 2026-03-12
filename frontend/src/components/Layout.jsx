import Sidebar from './Sidebar'

export default function Layout({ children, user, onLogout }) {
  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
