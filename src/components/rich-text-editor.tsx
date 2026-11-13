'use client'

import { useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  RemoveFormatting,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ToolbarItem = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  command?: string
  link?: boolean
  group?: boolean
}

/** Конфигурация тулбара (без функций — безопасно вне рендера) */
const TOOLBAR: ToolbarItem[] = [
  { title: 'Полужирный', icon: Bold, command: 'bold' },
  { title: 'Курсив', icon: Italic, command: 'italic' },
  { title: 'Подчёркнутый', icon: Underline, command: 'underline' },
  { title: 'Маркированный список', icon: List, command: 'insertUnorderedList', group: true },
  { title: 'Нумерованный список', icon: ListOrdered, command: 'insertOrderedList' },
  { title: 'Вставить ссылку', icon: Link, link: true, group: true },
  { title: 'Очистить форматирование', icon: RemoveFormatting, command: 'removeFormat' },
]

/**
 * Простой форматированный редактор описания задачи.
 * Результат хранится как HTML в скрытом поле `name` формы.
 */
export function RichTextEditor({
  name,
  defaultValue = '',
  minHeight = 150,
}: {
  name: string
  defaultValue?: string
  minHeight?: number
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    const input = inputRef.current
    if (!editor || !input) return
    editor.innerHTML = defaultValue || ''
    input.value = editor.innerHTML
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleInput() {
    const editor = editorRef.current
    const input = inputRef.current
    if (editor && input) input.value = editor.innerHTML
  }

  function runCommand(item: ToolbarItem) {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    if (item.link) {
      const url = window.prompt('Адрес ссылки:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else if (item.command) {
      document.execCommand(item.command, false)
    }
    handleInput()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
      <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/50 px-1.5 py-1">
        {TOOLBAR.map((item) => (
          <button
            key={item.title}
            type="button"
            title={item.title}
            aria-label={item.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(item)}
            className={cn(
              'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              item.group && 'ml-2 border-l border-border pl-2.5',
            )}
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Описание задачи"
        data-placeholder="Подробности, ссылки, критерии готовности…"
        onInput={handleInput}
        onBlur={handleInput}
        className="prose prose-sm dark:prose-invert max-w-none cursor-text px-3 py-2.5 text-sm outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:my-0.5"
        style={{ minHeight }}
      />
      <input type="hidden" name={name} ref={inputRef} defaultValue={defaultValue} />
    </div>
  )
}
