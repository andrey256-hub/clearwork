import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
        <Check className="h-[18px] w-[18px]" strokeWidth={3} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        ClearWork
      </span>
    </span>
  )
}
