import type { Asset } from "@ark/data-types"

export function monthsBetween(from: Date, to: Date): number {
  const yearDiff = to.getFullYear() - from.getFullYear()
  const monthDiff = to.getMonth() - from.getMonth()
  return Math.max(0, yearDiff * 12 + monthDiff)
}

export function monthsElapsedSince(iso: string): number {
  return monthsBetween(new Date(iso), new Date())
}

export function bookValueAt(asset: Asset, asOf: Date): number {
  const cost = Number(asset.acquisitionCost)
  const residual = Number(asset.residualValue)
  const depreciableBase = cost - residual
  const life = asset.usefulLifeMonths
  if (life <= 0 || depreciableBase <= 0) return cost
  const endOfLife =
    asset.status === "disposed" && asset.disposalDate ? new Date(asset.disposalDate) : asOf
  const monthsInService = Math.min(monthsBetween(new Date(asset.acquisitionDate), endOfLife), life)
  const monthly = depreciableBase / life
  const accumulated = monthly * monthsInService
  return Math.max(residual, cost - accumulated)
}

export interface SchedulePoint {
  monthIndex: number
  date: Date
  depreciation: number
  accumulated: number
  bookValue: number
}

export function depreciationSchedule(asset: Asset): SchedulePoint[] {
  const cost = Number(asset.acquisitionCost)
  const residual = Number(asset.residualValue)
  const depreciableBase = cost - residual
  const life = asset.usefulLifeMonths
  if (life <= 0 || depreciableBase <= 0) return []
  const monthly = depreciableBase / life
  const start = new Date(asset.acquisitionDate)
  const points: SchedulePoint[] = []
  let accumulated = 0
  for (let i = 1; i <= life; i++) {
    accumulated += monthly
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1)
    points.push({
      monthIndex: i,
      date,
      depreciation: monthly,
      accumulated,
      bookValue: cost - accumulated,
    })
  }
  return points
}
