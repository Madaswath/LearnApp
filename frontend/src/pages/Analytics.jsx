import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const data = [
  { week: 'W1', progress: 12, skill: 10 },
  { week: 'W2', progress: 28, skill: 22 },
  { week: 'W3', progress: 42, skill: 36 },
  { week: 'W4', progress: 64, skill: 58 },
]

export default function Analytics() {
  return (
    <div className="card h-[420px]">
      <h2 className="text-2xl font-semibold mb-4">Learning Analytics</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line type="monotone" dataKey="progress" stroke="#6366f1" strokeWidth={3} />
          <Line type="monotone" dataKey="skill" stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
