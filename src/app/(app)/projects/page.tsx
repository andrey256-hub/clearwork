import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { isTaskStatus } from '@/lib/constants'
import { ProjectsView, type ProjectRow } from './projects-view'

export default async function ProjectsPage() {
  const user = await requireUser()
  const isAdmin = user.role === 'admin'

  const [projects, taskGroups] = await Promise.all([
    db.project.findMany({ orderBy: [{ status: 'asc' }, { name: 'asc' }] }),
    db.task.groupBy({ by: ['projectId', 'status'], _count: { _all: true } }),
  ])

  const openByProject = new Map<string, number>()
  const doneByProject = new Map<string, number>()
  for (const g of taskGroups) {
    const status = isTaskStatus(g.status) ? g.status : 'todo'
    if (status === 'done') {
      doneByProject.set(g.projectId, g._count._all)
    } else {
      openByProject.set(
        g.projectId,
        (openByProject.get(g.projectId) ?? 0) + g._count._all,
      )
    }
  }

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    status: p.status,
    openCount: openByProject.get(p.id) ?? 0,
    doneCount: doneByProject.get(p.id) ?? 0,
  }))

  return <ProjectsView projects={rows} isAdmin={isAdmin} />
}
