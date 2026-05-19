import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'write'

// Единая модель: subject = код раздела меню (menu_<раздел>) или 'all' / 'own_profile'.
// Используем строковый тип, т.к. перечислять все menu_* кодов нецелесообразно.
export type Subjects = string

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
