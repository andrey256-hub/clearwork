'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Archive, ArchiveRestore, ArrowRight } from 'lucide-react'
import { toggleProjectStatusAction } from '@/lib/actions/projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectDialog, type ProjectDialogData } from '@/components/project-dialog'
import { cn } from '@/lib/utils'

export type ProjectRow = ProjectDialogData & {
  openCount: number
  doneCount: number
}

export function ProjectsView({
  projects,
  isAdmin,
}: {
  projects: ProjectRow[]
  isAdmin: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [, startTransition] = useTransition()

  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status === 'archived')

  function renderCard(project: ProjectRow) {
    const isArchived = project.status === 'archived'
    return (
      <div
        key={project.id}
        className={cn(
          'group relative overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md',
          isArchived && 'opacity-70',
        )}
      >
        <div
          className="h-1 w-full"
          style={{ backgroundColor: project.color }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold">
                  {project.name}
                </h2>
                {isArchived && (
                  <Badge className="bg-muted text-muted-foreground">
                    Архив
                  </Badge>
                )}
              </div>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
            {isAdmin && (
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Редактировать"
                  title="Редактировать"
                  onClick={() => setEditing(project)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label={isArchived ? 'Восстановить' : 'В архив'}
                  title={isArchived ? 'Восстановить' : 'В архив'}
                  onClick={() =>
                    startTransition(() => toggleProjectStatusAction(project.id))
                  }
                >
                  {isArchived ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted px-2 py-2">
              <p className="text-base font-semibold tabular-nums">
                {project.openCount}
              </p>
              <p className="text-[11px] text-muted-foreground">открытых</p>
            </div>
            <div className="rounded-lg bg-muted px-2 py-2">
              <p className="text-base font-semibold tabular-nums">
                {project.doneCount}
              </p>
              <p className="text-[11px] text-muted-foreground">готово</p>
            </div>
            <div className="rounded-lg bg-muted px-2 py-2">
              <p className="text-base font-semibold tabular-nums">
                {project.openCount + project.doneCount}
              </p>
              <p className="text-[11px] text-muted-foreground">всего</p>
            </div>
          </div>

          <a
            href={`/tasks?project=${project.id}`}
            className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
          >
            Задачи проекта
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Проекты</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {active.length} активных
            {archived.length > 0 ? ` · ${archived.length} в архиве` : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Новый проект
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center">
          <p className="text-sm font-medium">Проектов пока нет</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isAdmin
              ? 'Создайте первый проект, чтобы начать вести задачи'
              : 'Попросите администратора создать проект'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map(renderCard)}
          </div>
          {archived.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-medium text-muted-foreground">
                Архив
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map(renderCard)}
              </div>
            </>
          )}
        </>
      )}

      {creating && (
        <ProjectDialog onClose={() => setCreating(false)} />
      )}
      {editing && (
        <ProjectDialog
          key={editing.id}
          project={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
