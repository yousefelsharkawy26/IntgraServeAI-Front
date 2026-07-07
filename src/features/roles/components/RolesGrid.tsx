import { useState } from 'react'

import { motion } from 'framer-motion'


import {
  useRoles,
} from '../hooks/useRoles'

import { Skeleton } from '@/components/ui/skeleton'

import RoleCard from './RoleCard'

import RoleMembersModal from './RoleMembersModal'

export default function RolesGrid() {
  const { data: roles, isLoading } = useRoles()

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)



  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Manage roles and their associated permissions. Edit role assignments per
          user from the Users screen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles?.map((role, index) => (
          <RoleCard
            key={role.id}
            role={role}
            index={index}
            onViewMembers={setSelectedRoleId}
          />
        ))}
      </div>

      <RoleMembersModal
        roleId={selectedRoleId}
        onClose={() => setSelectedRoleId(null)}
      />

    </motion.div>
  )
}