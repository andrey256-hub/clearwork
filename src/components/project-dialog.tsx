'use client'

import { useEffect, useState, useActionState } from 'react'
import {
  createProjectAction,
  updateProjectAction,
  } from '@/lib/actions/projects'
import type { ActionState } from '@/lib/actions/auth'
import { PROJECT_COLORS } from '@/lib/constants'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea, Field } from '@/components/ui/input'
import { FormError } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export type ProjectDialogData = {
  id: string
  name: string
  description: string
  color: string
  status: string
}

export function ProjectDialog({
  project,
  onClose,
}: {
  project?: ProjectDialogData | null
  onClose: () => void
}) {
  const action = project ? updateProjectAction : createProjectAction
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  )
  const [color, setColor] = useState(
    project?.color ?? PROJECT_COLORS[0],
  )

  useEffect(() => {
    if (state?.ok) onClose()
  }, [state?.ok, onClose])

  return (
    <Modal
      open
      onClose={onClose}
      title={project ? 'Редактирование проекта' : 'Новый проект'}
    >
      <form action={formAction} className="space-y-4">
        {project && <input type="hidden" name="id" value={project.id} />}
        <input type="hidden" name="color" value={color} />
        <FormError message={state?.error} />

        <Field label="Название" htmlFor="project-name">
          <Input
            id="project-name"
            name="name"
            defaultValue={project?.name ?? ''}
            required
            placeholder="Например: Сайт компании"
            autoFocus
          />
        </Field>

        <Field label="Описание">
          <Textarea
            name="description"
            rows={2}
            defaultValue={project?.description ?? ''}
            placeholder="Коротко о проекте (необязательно)"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-[13px] font-medium">Цвет</p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Цвет ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  'h-7 w-7 rounded-full transition-transform',
                  color === c
                    ? 'scale-110 ring-2 ring-ring ring-offset-2 ring-offset-card'
                    : 'hover:scale-105',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {project && (
          <Field label="Статус проекта">
            <Select name="status" defaultValue={project.status}>
              <option value="active">Активный</option>
              <option value="archived">Архивный</option>
            </Select>
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" pending={pending}>
            {project ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
