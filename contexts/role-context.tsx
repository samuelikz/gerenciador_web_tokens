// components/auth/role-context.tsx
"use client"

import * as React from "react"

type Role = "ADMIN" | "USER" | ""

const RoleContext = React.createContext<Role>("")

export function RoleProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole() {
  return React.useContext(RoleContext)
}
