import { Label } from '@/components/ui/label'

interface Role {
  id: string
  name: string
}

interface Props {
  roles: Role[]
  selected: string[]
  onToggle: (id: string) => void
  error?: string
}

export function UserRolesSelector({ roles, selected, onToggle, error }: Props) {
  return (
    <div>
      <Label className="text-sm font-medium">Roles</Label>
      <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-border-light)] p-3">
        {roles.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">No roles available.</p>
        )}
        {roles.map((role) => {
          const checked = selected.includes(role.id)
          return (
            <label
              key={role.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-bg-base)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(role.id)}
                className="h-4 w-4 rounded border-[var(--color-border-medium)]"
              />
              <span className="text-sm text-[var(--color-text-primary)]">{role.name}</span>
            </label>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}