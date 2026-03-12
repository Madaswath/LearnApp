import { useEffect, useState } from 'react'
import { fetchProjects } from '../services/api'

export default function Projects() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Projects</h2>
      {projects.map((project) => (
        <div key={project.id} className="card">
          <h3 className="text-lg font-semibold">{project.title} <span className="text-xs text-slate-400">({project.level})</span></h3>
          <p className="text-slate-300 mb-3">{project.brief}</p>
          <ul className="list-disc pl-6 text-slate-300">
            {project.milestones.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
