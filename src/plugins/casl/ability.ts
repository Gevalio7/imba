import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

// ex: Post, Comment, User, etc. We haven't used any of these in our demo though.
export type Subjects = 'Post' | 'Comment' | 'all' | 'system_settings' | 'manage_users' | 'super_user' | 'tickets' | 'own_tickets' | 'all_tickets' | 'ticket_status' | 'knowledge_base' | 'reports' | 'own_profile'

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
