export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Welcome back</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card"><p className="text-slate-400">Active Paths</p><p className="text-3xl font-bold">3</p></div>
        <div className="card"><p className="text-slate-400">Completion</p><p className="text-3xl font-bold">64%</p></div>
        <div className="card"><p className="text-slate-400">Mentor Sessions</p><p className="text-3xl font-bold">18</p></div>
      </div>
    </div>
  )
}
