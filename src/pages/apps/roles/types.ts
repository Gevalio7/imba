export interface MenuChild {
  id: string
  label: string
  code?: string
}

export interface MenuCategory {
  category: string
  label: string
  children: MenuChild[]
}

export interface Role {
  id: number
  name: string
  message: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
