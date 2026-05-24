import type { StockMovement } from "./types"

type MovementQuantity = Pick<StockMovement, "quantity" | "type">

export function formatMovementQuantity(movement: MovementQuantity) {
  const quantity = Number(movement.quantity) || 0
  if (quantity === 0) return "0"
  if (movement.type === "in") return `+${Math.abs(quantity)}`
  if (movement.type === "out") return `-${Math.abs(quantity)}`
  return `${quantity > 0 ? "+" : ""}${quantity}`
}

export function movementQuantityClass(movement: MovementQuantity) {
  const quantity = Number(movement.quantity) || 0
  if (movement.type === "in" || quantity > 0) return "text-green-600"
  if (movement.type === "out" || quantity < 0) return "text-red-600"
  return "text-yellow-600"
}
