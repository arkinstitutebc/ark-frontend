import type { GlAccount, GlAccountSection, TxnCategory } from "@ark/data-types"
import type { SelectOption } from "@ark/ui"
import { categoryOptionsBySection, GL_SECTION_LABELS, GL_SECTIONS } from "@data/gl-defaults"
import type { ProfitCenterSetting } from "@data/hooks"
import { profitCenterOptions, txnCategoryOptions } from "@data/schemas"

export const fallbackProfitCenterOptions = profitCenterOptions.map(value => ({
  label: value === "Admin" ? "Admin / Shared" : value,
  value,
}))

export function isTxnCategory(value?: string | null): value is TxnCategory {
  return !!value && txnCategoryOptions.includes(value as TxnCategory)
}

export function buildDisbursementCategoryOptions(
  glAccounts: readonly GlAccount[] | undefined
): SelectOption<string>[] {
  const liveAccounts = (glAccounts ?? [])
    .filter(
      account => account.active && account.section !== "revenue" && isTxnCategory(account.code)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))

  if (liveAccounts.length === 0) {
    return categoryOptionsBySection().flatMap(group => [
      { label: group.label, value: `group-${group.label}`, disabled: true },
      ...group.options,
    ])
  }

  const sections = [
    ...GL_SECTIONS,
    ...Array.from(new Set(liveAccounts.map(account => account.section))).filter(
      section => !GL_SECTIONS.includes(section as never)
    ),
  ] as GlAccountSection[]

  return sections.flatMap(section => {
    const accounts = liveAccounts.filter(account => account.section === section)
    if (accounts.length === 0) return []
    return [
      {
        label: GL_SECTION_LABELS[section as keyof typeof GL_SECTION_LABELS] ?? section,
        value: `group-${section}`,
        disabled: true,
      },
      ...accounts.map(account => ({ label: account.label, value: account.code })),
    ]
  })
}

export function buildProfitCenterOptions(
  profitCenters: readonly ProfitCenterSetting[] | undefined
): SelectOption<string>[] {
  const liveCenters = (profitCenters ?? [])
    .filter(center => center.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))

  if (liveCenters.length === 0) return fallbackProfitCenterOptions
  return liveCenters.map(center => ({ label: center.label, value: center.code }))
}
