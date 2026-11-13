export type TaskOwnerInfo = {
  assigneeId: string | null
  createdById: string | null
}

export type EditUser = { id: string; role: string }

/**
 * Право редактирования задачи:
 * - задача с исполнителем — только её исполнитель (админ тоже не может чужую);
 * - задача без исполнителя — тот, кто её создал;
 * - старые задачи без создателя и без исполнителя — только админ.
 */
export function canEditTask(task: TaskOwnerInfo, user: EditUser): boolean {
  if (task.assigneeId) return task.assigneeId === user.id
  if (task.createdById) return task.createdById === user.id
  return user.role === 'admin'
}
