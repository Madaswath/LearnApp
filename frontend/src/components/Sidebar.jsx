export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} hidden md:flex min-h-screen border-r border-slate-800/70 bg-slate-950/80 backdrop-blur flex-col transition-all duration-300`}
    >
      <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold tracking-wide">Lumina AI</h1>
            <p className="text-xs text-slate-400">Learning cockpit</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="h-10 w-10 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          {collapsed ? '☰' : '✕'}
        </button>
      </div>

      <div className="flex-1 p-4 text-sm text-slate-400">
        {!collapsed ? (
          <p className="leading-relaxed">
            Navigation is now streamlined into the dashboard cards and the top-right user menu for a cleaner demo flow.
          </p>
        ) : (
          <p className="text-center">⋯</p>
        )}
      </div>
    </aside>
  )
}
