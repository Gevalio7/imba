import type { TestEntity } from './types'

interface DB {
  testEntities: TestEntity[]
}

export const db: DB = {
  testEntities: [
    {
      id: 1,
      name: 'Entity One',
      comment: 'This is the first test entity.',
    },
    {
      id: 2,
      name: 'Entity Two',
      comment: 'Second entity with a comment.',
    },
    {
      id: 3,
      name: 'Entity Three',
      comment: 'Third entity for testing.',
    },
    {
      id: 4,
      name: 'Entity Four',
      comment: 'Another test entity.',
    },
    {
      id: 5,
      name: 'Entity Five',
      comment: 'Fifth entity in the list.',
    },
  ],
}
