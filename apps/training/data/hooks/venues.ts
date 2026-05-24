import { createCrudHooks } from "@ark/ui"
import { queryKeys } from "../query-keys"
import type { Venue } from "../types"

interface CreateVenueInput {
  name: string
  notes?: string
}

interface UpdateVenueInput {
  name?: string
  notes?: string
  active?: boolean
}

const crud = createCrudHooks<Venue, Venue, CreateVenueInput, UpdateVenueInput, void>({
  basePath: "/api/training/venues",
  domain: "training-venues",
  label: "Venue",
  messages: {
    create: "Venue added",
    delete: "Venue removed",
  },
  queryKeys: {
    all: queryKeys.venues.all,
    list: () => queryKeys.venues.all,
    detail: id => queryKeys.venues.detail(id),
  },
})

export const useVenues = crud.useList
export const useCreateVenue = crud.useCreate
export const useUpdateVenue = crud.useUpdate
export const useDeleteVenue = crud.useDelete
