import { paginateArray } from '@api-utils/paginateArray'
import is from '@sindresorhus/is'
import { destr } from 'destr'
import type { PathParams } from 'msw'
import { HttpResponse, http } from 'msw'
import { db } from './db'

export const handlerAppsTestEntities = [
  // Get Test Entities
  http.get(('/api/apps/test-entities'), ({ request }) => {
    console.log('MSW: Handling GET /api/apps/test-entities')
    console.log('Request URL:', request.url)
    const url = new URL(request.url)

    const q = url.searchParams.get('q')
    const sortBy = url.searchParams.get('sortBy')
    const itemsPerPage = url.searchParams.get('itemsPerPage')
    const page = url.searchParams.get('page')
    const orderBy = url.searchParams.get('orderBy')

    const searchQuery = is.string(q) ? q : undefined
    const queryLower = (searchQuery ?? '').toString().toLowerCase()

    const parsedSortBy = destr(sortBy)
    const sortByLocal = is.string(parsedSortBy) ? parsedSortBy : ''

    const parsedOrderBy = destr(orderBy)
    const orderByLocal = is.string(parsedOrderBy) ? parsedOrderBy : ''

    const parsedItemsPerPage = destr(itemsPerPage)
    const parsedPage = destr(page)

    const itemsPerPageLocal = is.number(parsedItemsPerPage) ? parsedItemsPerPage : 10
    const pageLocal = is.number(parsedPage) ? parsedPage : 1

    // filter entities
    let filteredEntities = db.testEntities.filter(entity =>
      entity.name.toLowerCase().includes(queryLower) ||
      entity.comment.toLowerCase().includes(queryLower)
    )

    // sort entities
    if (sortByLocal) {
      if (sortByLocal === 'name') {
        filteredEntities = filteredEntities.sort((a, b) => {
          if (orderByLocal === 'asc')
            return a.name.localeCompare(b.name)
          else
            return b.name.localeCompare(a.name)
        })
      }
      if (sortByLocal === 'comment') {
        filteredEntities = filteredEntities.sort((a, b) => {
          if (orderByLocal === 'asc')
            return a.comment.localeCompare(b.comment)
          else
            return b.comment.localeCompare(a.comment)
        })
      }
    }

    const totalEntities = filteredEntities.length

    console.log('Returning', paginateArray(filteredEntities, itemsPerPageLocal, pageLocal).length, 'entities out of', totalEntities)

    return HttpResponse.json(
      {
        testEntities: paginateArray(filteredEntities, itemsPerPageLocal, pageLocal),
        total: totalEntities,
      },
      { status: 200 },
    )
  }),

  // Get Single Test Entity
  http.get<PathParams>(('/api/apps/test-entities/:id'), ({ params }) => {
    const entityId = Number(params.id)

    const entity = db.testEntities.find(e => e.id === entityId)

    if (!entity) {
      return HttpResponse.json({ message: 'Test Entity not found' }, { status: 404 })
    }
    else {
      return HttpResponse.json(entity, { status: 200 })
    }
  }),

  // Delete Test Entity
  http.delete(('/api/apps/test-entities/:id'), ({ params }) => {
    const entityId = Number(params.id)

    const entityIndex = db.testEntities.findIndex(e => e.id === entityId)

    if (entityIndex === -1) {
      return HttpResponse.json('Test Entity not found', { status: 404 })
    }
    else {
      db.testEntities.splice(entityIndex, 1)

      return new HttpResponse(null, {
        status: 204,
      })
    }
  }),

  // Add Test Entity
  http.post(('/api/apps/test-entities'), async ({ request }) => {
    const entity = await request.json() as any

    const newEntity = {
      ...entity,
      id: db.testEntities.length + 1,
    }

    db.testEntities.push(newEntity)

    return HttpResponse.json(newEntity, { status: 201 })
  }),

  // Update Test Entity
  http.put(('/api/apps/test-entities/:id'), async ({ request, params }) => {
    const entityId = Number(params.id)
    const updatedEntity = await request.json() as any

    const entityIndex = db.testEntities.findIndex(e => e.id === entityId)

    if (entityIndex === -1) {
      return HttpResponse.json('Test Entity not found', { status: 404 })
    }
    else {
      db.testEntities[entityIndex] = { ...db.testEntities[entityIndex], ...updatedEntity }

      return HttpResponse.json(db.testEntities[entityIndex], { status: 200 })
    }
  }),
]
