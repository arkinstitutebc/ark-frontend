import type { GlAccount, GlAccountSection } from "@ark/data-types"
import {
  ConfirmDialog,
  Modal,
  ModalFooter,
  PageContainer,
  PageHeader,
  ScrollableDataTable,
  THead,
  Th,
  Tr,
} from "@ark/ui"
import {
  type ClassificationRuleSetting,
  type CreateGlAccountInput,
  type CreateProfitCenterInput,
  type CreateTrainingOfferingInput,
  type ProfitCenterSetting,
  type TrainingOfferingSetting,
  useAuditEvents,
  useClassificationRules,
  useCreateClassificationRule,
  useCreateGlAccount,
  useCreateProfitCenter,
  useCreateTrainingOffering,
  useDeactivateGlAccount,
  useGlAccounts,
  useProfitCenters,
  useTrainingOfferings,
  useUpdateClassificationRule,
  useUpdateGlAccount,
  useUpdateProfitCenter,
  useUpdateTrainingOffering,
} from "@data/hooks"
import { Pencil, Power, RotateCcw } from "lucide-solid"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import {
  SettingsCheckbox,
  SettingsEmptyRow,
  SettingsFormGrid,
  SettingsModalForm,
  SettingsNumberField,
  SettingsPanelHeader,
  SettingsRowButton,
  SettingsSearchInput,
  SettingsSelectField,
  SettingsStatCard,
  SettingsStatusPill,
  SettingsStickyFooter,
  SettingsTextArea,
  SettingsTextField,
} from "@/components/finance/settings/settings-ui"
import { QueryBoundary } from "@/components/ui"

type SettingsTab = "accounts" | "profit-centers" | "offerings" | "rules" | "activity"

type StatusConfirm =
  | { kind: "gl"; id: string; label: string; active: boolean }
  | { kind: "profit-center"; id: string; label: string; active: boolean }
  | { kind: "offering"; id: string; label: string; active: boolean }
  | { kind: "rule"; id: string; label: string; active: boolean }

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "accounts", label: "Account Codes" },
  { id: "profit-centers", label: "Funds / Programs" },
  { id: "offerings", label: "Training Offerings" },
  { id: "rules", label: "Auto-coding Rules" },
  { id: "activity", label: "Activity" },
]

const SECTION_LABELS: Record<GlAccountSection, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Admin Expense",
  "fixed-asset": "Fixed Asset",
  revenue: "Revenue",
  other: "Other",
}
const SECTION_ORDER: GlAccountSection[] = [
  "cost-of-services",
  "admin-expense",
  "fixed-asset",
  "revenue",
  "other",
]
const SECTION_OPTIONS = SECTION_ORDER.map(s => ({ label: SECTION_LABELS[s], value: s }))
const EXPENSE_CATEGORY_OPTIONS = [
  { label: "-", value: "" },
  { label: "Cost of Services", value: "cost-of-services" },
  { label: "Admin Expense", value: "admin-expense" },
  { label: "Fixed Asset", value: "fixed-asset" },
]
const TREATMENT_OPTIONS = [
  { label: "-", value: "" },
  { label: "Variable", value: "variable" },
  { label: "Traceable Fixed", value: "traceable-fixed" },
  { label: "Common / Overhead", value: "common-overhead" },
  { label: "Capital", value: "capital" },
]

const blankGlForm = (): CreateGlAccountInput => ({
  code: "",
  label: "",
  section: "cost-of-services",
  defaultExpenseCategory: null,
  defaultAccountingTreatment: null,
  sortOrder: 0,
})

const blankProfitCenterForm = (): CreateProfitCenterInput => ({
  code: "",
  label: "",
  fundSource: "",
  segmentGroup: "",
  notes: "",
  sortOrder: 0,
  active: true,
})

const blankOfferingForm = (): CreateTrainingOfferingInput => ({
  code: "",
  label: "",
  sector: "",
  notes: "",
  sortOrder: 0,
  active: true,
})

const blankRuleForm = () => ({
  glAccountCode: "",
  profitCenterCode: "",
  defaultExpenseCategory: "cost-of-services",
  defaultAccountingTreatment: "variable",
  defaultCostType: "",
  defaultAssetCategory: "",
  defaultUsefulLifeMonths: undefined as number | undefined,
  requiresAssetReview: false,
  notes: "",
  sortOrder: 0,
  active: true,
})

function matchesSearch(query: string, values: string[]) {
  const needle = query.toLowerCase()
  return values.some(value => value.toLowerCase().includes(needle))
}

export default function FinanceSettingsPage() {
  const glAccounts = useGlAccounts(() => ({ includeInactive: true }))
  const profitCenters = useProfitCenters(() => ({ includeInactive: true }))
  const offerings = useTrainingOfferings(() => ({ includeInactive: true }))
  const rules = useClassificationRules(() => ({ includeInactive: true }))
  const auditEvents = useAuditEvents(() => ({ module: "finance", page: 1, limit: 20 }))

  const createGl = useCreateGlAccount()
  const updateGl = useUpdateGlAccount()
  const deactivateGl = useDeactivateGlAccount()
  const createProfitCenter = useCreateProfitCenter()
  const updateProfitCenter = useUpdateProfitCenter()
  const createOffering = useCreateTrainingOffering()
  const updateOffering = useUpdateTrainingOffering()
  const createRule = useCreateClassificationRule()
  const updateRule = useUpdateClassificationRule()

  const [tab, setTab] = createSignal<SettingsTab>("accounts")
  const [accountSearch, setAccountSearch] = createSignal("")
  const [ruleSearch, setRuleSearch] = createSignal("")
  const [glModalOpen, setGlModalOpen] = createSignal(false)
  const [editingGl, setEditingGl] = createSignal<GlAccount | null>(null)
  const [glForm, setGlForm] = createSignal<CreateGlAccountInput>(blankGlForm())
  const [pcModalOpen, setPcModalOpen] = createSignal(false)
  const [editingPc, setEditingPc] = createSignal<ProfitCenterSetting | null>(null)
  const [pcForm, setPcForm] = createSignal<CreateProfitCenterInput>(blankProfitCenterForm())
  const [offeringModalOpen, setOfferingModalOpen] = createSignal(false)
  const [editingOffering, setEditingOffering] = createSignal<TrainingOfferingSetting | null>(null)
  const [offeringForm, setOfferingForm] = createSignal<CreateTrainingOfferingInput>(
    blankOfferingForm()
  )
  const [ruleModalOpen, setRuleModalOpen] = createSignal(false)
  const [editingRule, setEditingRule] = createSignal<ClassificationRuleSetting | null>(null)
  const [ruleForm, setRuleForm] = createSignal(blankRuleForm())
  const [statusConfirm, setStatusConfirm] = createSignal<StatusConfirm | null>(null)

  const activeGlAccounts = createMemo(
    () => glAccounts.data?.filter(item => item.active).length ?? 0
  )
  const activeProfitCenters = createMemo(
    () => profitCenters.data?.filter(item => item.active).length ?? 0
  )
  const activeOfferings = createMemo(() => offerings.data?.filter(item => item.active).length ?? 0)
  const activeRules = createMemo(() => rules.data?.filter(item => item.active).length ?? 0)

  const sortedGlAccounts = createMemo(() =>
    [...(glAccounts.data ?? [])].sort(
      (a, b) =>
        SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section) ||
        a.sortOrder - b.sortOrder ||
        a.label.localeCompare(b.label)
    )
  )
  const sortedProfitCenters = createMemo(() =>
    [...(profitCenters.data ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
    )
  )
  const sortedOfferings = createMemo(() =>
    [...(offerings.data ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
    )
  )
  const sortedRules = createMemo(() =>
    [...(rules.data ?? [])].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.glAccountCode.localeCompare(b.glAccountCode) ||
        (a.profitCenterCode ?? "").localeCompare(b.profitCenterCode ?? "")
    )
  )
  const filteredGlAccounts = createMemo(() => {
    const query = accountSearch().trim()
    if (!query) return sortedGlAccounts()
    return sortedGlAccounts().filter(item =>
      matchesSearch(query, [
        item.code,
        item.label,
        SECTION_LABELS[item.section],
        item.defaultAccountingTreatment ?? "",
        item.notes ?? "",
      ])
    )
  })
  const filteredRules = createMemo(() => {
    const query = ruleSearch().trim()
    if (!query) return sortedRules()
    return sortedRules().filter(item =>
      matchesSearch(query, [
        item.glAccountCode,
        item.profitCenterCode ?? "",
        item.defaultExpenseCategory ?? "",
        item.defaultAccountingTreatment ?? "",
        item.defaultCostType ?? "",
        item.defaultAssetCategory ?? "",
        item.notes ?? "",
      ])
    )
  })

  const refreshAudit = () => void auditEvents.refetch()
  const closeStatusConfirm = () => setStatusConfirm(null)
  const statusActionLabel = () => (statusConfirm()?.active ? "Deactivate" : "Restore")
  const statusPending = () =>
    deactivateGl.isPending ||
    updateGl.isPending ||
    updateProfitCenter.isPending ||
    updateOffering.isPending ||
    updateRule.isPending

  const confirmStatusChange = () => {
    const target = statusConfirm()
    if (!target) return

    const onSuccess = () => {
      refreshAudit()
      closeStatusConfirm()
    }

    if (target.kind === "gl") {
      if (target.active) {
        deactivateGl.mutate(target.id, { onSuccess })
      } else {
        updateGl.mutate({ id: target.id, active: true }, { onSuccess })
      }
      return
    }

    const payload = { id: target.id, active: !target.active }
    if (target.kind === "profit-center") {
      updateProfitCenter.mutate(payload, { onSuccess })
      return
    }
    if (target.kind === "offering") {
      updateOffering.mutate(payload, { onSuccess })
      return
    }
    updateRule.mutate(payload, { onSuccess })
  }

  const openCreateGl = () => {
    setEditingGl(null)
    setGlForm(blankGlForm())
    setGlModalOpen(true)
  }

  const openEditGl = (acct: GlAccount) => {
    setEditingGl(acct)
    setGlForm({
      code: acct.code,
      label: acct.label,
      section: acct.section,
      defaultExpenseCategory: acct.defaultExpenseCategory ?? null,
      defaultAccountingTreatment: acct.defaultAccountingTreatment ?? null,
      notes: acct.notes ?? "",
      sortOrder: acct.sortOrder,
      active: acct.active,
    })
    setGlModalOpen(true)
  }

  const closeGlModal = () => {
    setGlModalOpen(false)
    setEditingGl(null)
  }

  const submitGl = (e: Event) => {
    e.preventDefault()
    const data = glForm()
    const payload = {
      ...data,
      defaultExpenseCategory: data.defaultExpenseCategory || null,
      defaultAccountingTreatment: data.defaultAccountingTreatment || null,
      notes: data.notes?.trim() || undefined,
    }
    const target = editingGl()
    if (target) {
      updateGl.mutate({ id: target.id, ...payload }, { onSuccess: closeGlModal })
    } else {
      createGl.mutate(payload, { onSuccess: closeGlModal })
    }
  }

  const openCreatePc = () => {
    setEditingPc(null)
    setPcForm(blankProfitCenterForm())
    setPcModalOpen(true)
  }

  const openEditPc = (item: ProfitCenterSetting) => {
    setEditingPc(item)
    setPcForm({
      code: item.code,
      label: item.label,
      fundSource: item.fundSource ?? "",
      segmentGroup: item.segmentGroup ?? "",
      notes: item.notes ?? "",
      sortOrder: item.sortOrder,
      active: item.active,
    })
    setPcModalOpen(true)
  }

  const closePcModal = () => {
    setPcModalOpen(false)
    setEditingPc(null)
  }

  const submitPc = (e: Event) => {
    e.preventDefault()
    const data = pcForm()
    const payload = {
      ...data,
      code: data.code.trim(),
      label: data.label.trim(),
      fundSource: data.fundSource?.trim() || undefined,
      segmentGroup: data.segmentGroup?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    }
    const target = editingPc()
    if (target) {
      updateProfitCenter.mutate({ id: target.id, ...payload }, { onSuccess: closePcModal })
    } else {
      createProfitCenter.mutate(payload, { onSuccess: closePcModal })
    }
  }

  const openCreateOffering = () => {
    setEditingOffering(null)
    setOfferingForm(blankOfferingForm())
    setOfferingModalOpen(true)
  }

  const openEditOffering = (item: TrainingOfferingSetting) => {
    setEditingOffering(item)
    setOfferingForm({
      code: item.code,
      label: item.label,
      sector: item.sector ?? "",
      notes: item.notes ?? "",
      sortOrder: item.sortOrder,
      active: item.active,
    })
    setOfferingModalOpen(true)
  }

  const closeOfferingModal = () => {
    setOfferingModalOpen(false)
    setEditingOffering(null)
  }

  const submitOffering = (e: Event) => {
    e.preventDefault()
    const data = offeringForm()
    const payload = {
      ...data,
      code: data.code.trim(),
      label: data.label.trim(),
      sector: data.sector?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    }
    const target = editingOffering()
    if (target) {
      updateOffering.mutate({ id: target.id, ...payload }, { onSuccess: closeOfferingModal })
    } else {
      createOffering.mutate(payload, { onSuccess: closeOfferingModal })
    }
  }

  const openCreateRule = () => {
    setEditingRule(null)
    setRuleForm(blankRuleForm())
    setRuleModalOpen(true)
  }

  const openEditRule = (item: ClassificationRuleSetting) => {
    setEditingRule(item)
    setRuleForm({
      glAccountCode: item.glAccountCode,
      profitCenterCode: item.profitCenterCode ?? "",
      defaultExpenseCategory: item.defaultExpenseCategory ?? "cost-of-services",
      defaultAccountingTreatment: item.defaultAccountingTreatment ?? "variable",
      defaultCostType: item.defaultCostType ?? "",
      defaultAssetCategory: item.defaultAssetCategory ?? "",
      defaultUsefulLifeMonths: item.defaultUsefulLifeMonths ?? undefined,
      requiresAssetReview: item.requiresAssetReview,
      notes: item.notes ?? "",
      sortOrder: item.sortOrder,
      active: item.active,
    })
    setRuleModalOpen(true)
  }

  const closeRuleModal = () => {
    setRuleModalOpen(false)
    setEditingRule(null)
  }

  const submitRule = (e: Event) => {
    e.preventDefault()
    const data = ruleForm()
    const payload = {
      ...data,
      glAccountCode: data.glAccountCode.trim(),
      profitCenterCode: data.profitCenterCode.trim() || undefined,
      defaultCostType: data.defaultCostType.trim() || undefined,
      defaultAssetCategory: data.defaultAssetCategory.trim() || undefined,
      defaultUsefulLifeMonths: data.defaultUsefulLifeMonths || undefined,
      notes: data.notes.trim() || undefined,
    }
    const target = editingRule()
    if (target) {
      updateRule.mutate({ id: target.id, ...payload }, { onSuccess: closeRuleModal })
    } else {
      createRule.mutate(payload, { onSuccess: closeRuleModal })
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Finance Settings"
        subtitle="Account codes, funds, offerings, and auto-coding rules in one workspace"
      />

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SettingsStatCard label="Active account codes" value={activeGlAccounts()} />
        <SettingsStatCard label="Active funds/programs" value={activeProfitCenters()} />
        <SettingsStatCard label="Active offerings" value={activeOfferings()} />
        <SettingsStatCard label="Active rules" value={activeRules()} />
      </div>

      <div class="bg-surface border border-border rounded-lg overflow-hidden">
        <div class="px-4 pt-4 border-b border-border">
          <div class="flex gap-1 overflow-x-auto">
            <For each={TABS}>
              {item => (
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  class={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    tab() === item.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={tab() === "accounts"}>
              <SettingsPanelHeader
                title="Account Codes"
                hint="Chart of accounts used by disbursements and reports"
                actionLabel="New Account"
                onAction={openCreateGl}
                trailing={
                  <SettingsSearchInput
                    value={accountSearch()}
                    onInput={setAccountSearch}
                    placeholder="Search accounts"
                  />
                }
              />
              <QueryBoundary query={glAccounts}>
                {() => (
                  <ScrollableDataTable>
                    <THead>
                      <Th size="compact" class="w-[190px]">
                        Code
                      </Th>
                      <Th size="compact" class="min-w-[260px]">
                        Label
                      </Th>
                      <Th size="compact" class="w-[170px]">
                        Section
                      </Th>
                      <Th size="compact" class="w-[170px]">
                        Default Treatment
                      </Th>
                      <Th size="compact" class="w-[100px]">
                        Status
                      </Th>
                      <Th size="compact" align="right" class="w-[160px]">
                        Actions
                      </Th>
                    </THead>
                    <tbody>
                      <Show
                        when={filteredGlAccounts().length > 0}
                        fallback={
                          <SettingsEmptyRow
                            colSpan={6}
                            title={
                              accountSearch().trim()
                                ? "No matching account codes"
                                : "No account codes yet"
                            }
                            detail={
                              accountSearch().trim()
                                ? "Try another code, label, section, or treatment."
                                : "Create an account code to start classifying transactions."
                            }
                          />
                        }
                      >
                        <For each={filteredGlAccounts()}>
                          {acct => (
                            <Tr class={acct.active ? "" : "opacity-50"} hover={false}>
                              <td class="px-3 py-2 font-mono text-xs text-muted whitespace-nowrap">
                                {acct.code}
                              </td>
                              <td class="px-3 py-2 text-sm text-foreground min-w-[220px]">
                                <span class="block font-medium">{acct.label}</span>
                                <Show when={acct.notes}>
                                  <span class="block text-xs text-muted">{acct.notes}</span>
                                </Show>
                              </td>
                              <td class="px-3 py-2 text-sm text-muted whitespace-nowrap">
                                {SECTION_LABELS[acct.section]}
                              </td>
                              <td class="px-3 py-2 text-sm text-muted whitespace-nowrap">
                                {acct.defaultAccountingTreatment ?? "-"}
                              </td>
                              <td class="px-3 py-2">
                                <SettingsStatusPill active={acct.active} />
                              </td>
                              <td class="px-3 py-2 text-right whitespace-nowrap">
                                <SettingsRowButton onClick={() => openEditGl(acct)}>
                                  <Pencil class="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </SettingsRowButton>
                                <SettingsRowButton
                                  tone={acct.active ? "danger" : "default"}
                                  onClick={() =>
                                    setStatusConfirm({
                                      kind: "gl",
                                      id: acct.id,
                                      label: acct.label,
                                      active: acct.active,
                                    })
                                  }
                                >
                                  <Show
                                    when={acct.active}
                                    fallback={<RotateCcw class="w-3.5 h-3.5" />}
                                  >
                                    <Power class="w-3.5 h-3.5" />
                                  </Show>
                                  <span>{acct.active ? "Deactivate" : "Restore"}</span>
                                </SettingsRowButton>
                              </td>
                            </Tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </ScrollableDataTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "profit-centers"}>
              <SettingsPanelHeader
                title="Funds / Programs"
                hint="Profit centers and fund sources used by finance workflows"
                actionLabel="New Fund"
                onAction={openCreatePc}
              />
              <QueryBoundary query={profitCenters}>
                {() => (
                  <ScrollableDataTable>
                    <THead>
                      <Th size="dense" class="w-[180px]">
                        Code
                      </Th>
                      <Th size="dense" class="min-w-[260px]">
                        Label
                      </Th>
                      <Th size="dense" class="w-[180px]">
                        Fund
                      </Th>
                      <Th size="dense" class="w-[100px]">
                        Status
                      </Th>
                      <Th size="dense" align="right" class="w-[160px]">
                        Actions
                      </Th>
                    </THead>
                    <tbody>
                      <Show
                        when={sortedProfitCenters().length > 0}
                        fallback={
                          <SettingsEmptyRow
                            colSpan={5}
                            title="No funds or programs yet"
                            detail="Create a fund or program to make it available in finance forms."
                          />
                        }
                      >
                        <For each={sortedProfitCenters()}>
                          {item => (
                            <tr class={`border-t border-border ${item.active ? "" : "opacity-50"}`}>
                              <td class="py-3 px-4 text-sm font-mono text-foreground">
                                {item.code}
                              </td>
                              <td class="py-3 px-4 text-sm text-foreground">
                                <span class="font-medium">{item.label}</span>
                                <Show when={item.notes}>
                                  <span class="block text-xs text-muted">{item.notes}</span>
                                </Show>
                              </td>
                              <td class="py-3 px-4 text-sm text-muted">{item.fundSource ?? "-"}</td>
                              <td class="py-3 px-4">
                                <SettingsStatusPill active={item.active} />
                              </td>
                              <td class="py-3 px-4 text-right whitespace-nowrap">
                                <SettingsRowButton onClick={() => openEditPc(item)}>
                                  <Pencil class="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </SettingsRowButton>
                                <SettingsRowButton
                                  tone={item.active ? "danger" : "default"}
                                  onClick={() =>
                                    setStatusConfirm({
                                      kind: "profit-center",
                                      id: item.id,
                                      label: item.label,
                                      active: item.active,
                                    })
                                  }
                                >
                                  <Show
                                    when={item.active}
                                    fallback={<RotateCcw class="w-3.5 h-3.5" />}
                                  >
                                    <Power class="w-3.5 h-3.5" />
                                  </Show>
                                  <span>{item.active ? "Deactivate" : "Restore"}</span>
                                </SettingsRowButton>
                              </td>
                            </tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </ScrollableDataTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "offerings"}>
              <SettingsPanelHeader
                title="Training Offerings"
                hint="Program catalog used by training batches and reports"
                actionLabel="New Offering"
                onAction={openCreateOffering}
              />
              <QueryBoundary query={offerings}>
                {() => (
                  <ScrollableDataTable>
                    <THead>
                      <Th size="dense" class="w-[180px]">
                        Code
                      </Th>
                      <Th size="dense" class="min-w-[280px]">
                        Offering
                      </Th>
                      <Th size="dense" class="w-[180px]">
                        Sector
                      </Th>
                      <Th size="dense" class="w-[100px]">
                        Status
                      </Th>
                      <Th size="dense" align="right" class="w-[160px]">
                        Actions
                      </Th>
                    </THead>
                    <tbody>
                      <Show
                        when={sortedOfferings().length > 0}
                        fallback={
                          <SettingsEmptyRow
                            colSpan={5}
                            title="No training offerings yet"
                            detail="Create offerings to align finance settings with training programs."
                          />
                        }
                      >
                        <For each={sortedOfferings()}>
                          {item => (
                            <tr class={`border-t border-border ${item.active ? "" : "opacity-50"}`}>
                              <td class="py-3 px-4 text-sm font-mono text-foreground">
                                {item.code}
                              </td>
                              <td class="py-3 px-4 text-sm text-foreground">
                                <span class="font-medium">{item.label}</span>
                                <Show when={item.notes}>
                                  <span class="block text-xs text-muted">{item.notes}</span>
                                </Show>
                              </td>
                              <td class="py-3 px-4 text-sm text-muted">{item.sector ?? "-"}</td>
                              <td class="py-3 px-4">
                                <SettingsStatusPill active={item.active} />
                              </td>
                              <td class="py-3 px-4 text-right whitespace-nowrap">
                                <SettingsRowButton onClick={() => openEditOffering(item)}>
                                  <Pencil class="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </SettingsRowButton>
                                <SettingsRowButton
                                  tone={item.active ? "danger" : "default"}
                                  onClick={() =>
                                    setStatusConfirm({
                                      kind: "offering",
                                      id: item.id,
                                      label: item.label,
                                      active: item.active,
                                    })
                                  }
                                >
                                  <Show
                                    when={item.active}
                                    fallback={<RotateCcw class="w-3.5 h-3.5" />}
                                  >
                                    <Power class="w-3.5 h-3.5" />
                                  </Show>
                                  <span>{item.active ? "Deactivate" : "Restore"}</span>
                                </SettingsRowButton>
                              </td>
                            </tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </ScrollableDataTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "rules"}>
              <SettingsPanelHeader
                title="Auto-coding Rules"
                hint="Defaults that reduce accounting choices in day-to-day forms"
                actionLabel="New Rule"
                onAction={openCreateRule}
                trailing={
                  <SettingsSearchInput
                    value={ruleSearch()}
                    onInput={setRuleSearch}
                    placeholder="Search rules"
                  />
                }
              />
              <QueryBoundary query={rules}>
                {() => (
                  <ScrollableDataTable>
                    <THead>
                      <Th size="dense" class="w-[190px]">
                        Account Code
                      </Th>
                      <Th size="dense" class="w-[180px]">
                        Fund / Program
                      </Th>
                      <Th size="dense" class="min-w-[260px]">
                        Defaults
                      </Th>
                      <Th size="dense" class="w-[100px]">
                        Status
                      </Th>
                      <Th size="dense" align="right" class="w-[160px]">
                        Actions
                      </Th>
                    </THead>
                    <tbody>
                      <Show
                        when={filteredRules().length > 0}
                        fallback={
                          <SettingsEmptyRow
                            colSpan={5}
                            title={
                              ruleSearch().trim() ? "No matching auto-coding rules" : "No rules yet"
                            }
                            detail={
                              ruleSearch().trim()
                                ? "Try another account, fund, category, or treatment."
                                : "Create rules to apply accounting defaults in forms."
                            }
                          />
                        }
                      >
                        <For each={filteredRules()}>
                          {item => (
                            <tr class={`border-t border-border ${item.active ? "" : "opacity-50"}`}>
                              <td class="py-3 px-4 text-sm font-mono text-foreground">
                                {item.glAccountCode}
                              </td>
                              <td class="py-3 px-4 text-sm text-muted">
                                {item.profitCenterCode ?? "-"}
                              </td>
                              <td class="py-3 px-4 text-xs text-muted">
                                <span class="block text-foreground">
                                  {item.defaultExpenseCategory ?? "-"}
                                </span>
                                {item.defaultAccountingTreatment ?? "-"}
                                <Show when={item.requiresAssetReview}>
                                  <span class="ml-2 text-primary">Asset review</span>
                                </Show>
                              </td>
                              <td class="py-3 px-4">
                                <SettingsStatusPill active={item.active} />
                              </td>
                              <td class="py-3 px-4 text-right whitespace-nowrap">
                                <SettingsRowButton onClick={() => openEditRule(item)}>
                                  <Pencil class="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </SettingsRowButton>
                                <SettingsRowButton
                                  tone={item.active ? "danger" : "default"}
                                  onClick={() =>
                                    setStatusConfirm({
                                      kind: "rule",
                                      id: item.id,
                                      label: item.profitCenterCode
                                        ? `${item.glAccountCode} / ${item.profitCenterCode}`
                                        : item.glAccountCode,
                                      active: item.active,
                                    })
                                  }
                                >
                                  <Show
                                    when={item.active}
                                    fallback={<RotateCcw class="w-3.5 h-3.5" />}
                                  >
                                    <Power class="w-3.5 h-3.5" />
                                  </Show>
                                  <span>{item.active ? "Deactivate" : "Restore"}</span>
                                </SettingsRowButton>
                              </td>
                            </tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </ScrollableDataTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "activity"}>
              <SettingsPanelHeader
                title="Recent Settings Activity"
                hint="Latest finance setting and catalog changes"
              />
              <QueryBoundary query={auditEvents}>
                {result => (
                  <ScrollableDataTable>
                    <THead>
                      <Th size="dense" class="w-[180px]">
                        When
                      </Th>
                      <Th size="dense" class="min-w-[320px]">
                        Change
                      </Th>
                      <Th size="dense" class="w-[220px]">
                        By
                      </Th>
                    </THead>
                    <tbody>
                      <Show
                        when={result.items.length > 0}
                        fallback={
                          <SettingsEmptyRow
                            colSpan={3}
                            title="No settings activity yet"
                            detail="Finance setting changes will appear here."
                          />
                        }
                      >
                        <For each={result.items}>
                          {event => (
                            <tr class="border-t border-border">
                              <td class="py-3 px-4 text-xs text-muted whitespace-nowrap">
                                {formatDateTime(event.createdAt)}
                              </td>
                              <td class="py-3 px-4 text-sm text-foreground">
                                <span class="font-medium">{actionLabel(event.action)}</span>{" "}
                                <span class="text-muted">{event.entityType}</span>
                                <span class="block text-xs text-muted font-mono">
                                  {event.entityId}
                                </span>
                              </td>
                              <td class="py-3 px-4 text-sm text-muted">
                                {event.actor ?? "System"}
                              </td>
                            </tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </ScrollableDataTable>
                )}
              </QueryBoundary>
            </Match>
          </Switch>
        </div>
      </div>

      <Modal
        open={glModalOpen()}
        onClose={closeGlModal}
        title={editingGl() ? "Edit Account Code" : "New Account Code"}
        size="xl"
      >
        <SettingsModalForm onSubmit={submitGl}>
          <SettingsFormGrid>
            <SettingsTextField
              label="Code"
              value={glForm().code}
              onInput={value => setGlForm({ ...glForm(), code: value })}
              placeholder="internet"
              required
              disabled={!!editingGl()}
            />
            <SettingsTextField
              label="Label"
              value={glForm().label}
              onInput={value => setGlForm({ ...glForm(), label: value })}
              placeholder="Internet Allowance"
              required
            />
            <SettingsSelectField
              label="Section"
              options={SECTION_OPTIONS}
              value={glForm().section}
              onChange={value => setGlForm({ ...glForm(), section: value as GlAccountSection })}
            />
            <SettingsNumberField
              label="Sort Order"
              value={glForm().sortOrder ?? 0}
              onInput={value => setGlForm({ ...glForm(), sortOrder: value })}
            />
            <SettingsSelectField
              label="Default Expense Category"
              options={EXPENSE_CATEGORY_OPTIONS}
              value={glForm().defaultExpenseCategory ?? ""}
              onChange={value => setGlForm({ ...glForm(), defaultExpenseCategory: value || null })}
            />
            <SettingsSelectField
              label="Default Treatment"
              options={TREATMENT_OPTIONS}
              value={glForm().defaultAccountingTreatment ?? ""}
              onChange={value =>
                setGlForm({ ...glForm(), defaultAccountingTreatment: value || null })
              }
            />
          </SettingsFormGrid>
          <SettingsTextArea
            label="Notes"
            value={glForm().notes ?? ""}
            onInput={value => setGlForm({ ...glForm(), notes: value })}
          />
          <Show when={editingGl()}>
            <SettingsCheckbox
              checked={glForm().active ?? true}
              onChange={active => setGlForm({ ...glForm(), active })}
            />
          </Show>
          <SettingsStickyFooter>
            <ModalFooter
              onCancel={closeGlModal}
              submitInForm
              submitLabel={editingGl() ? "Save" : "Create"}
              submitting={createGl.isPending || updateGl.isPending}
            />
          </SettingsStickyFooter>
        </SettingsModalForm>
      </Modal>

      <Modal
        open={pcModalOpen()}
        onClose={closePcModal}
        title={editingPc() ? "Edit Fund / Program" : "New Fund / Program"}
        size="xl"
      >
        <SettingsModalForm onSubmit={submitPc}>
          <SettingsFormGrid>
            <SettingsTextField
              label="Code"
              value={pcForm().code}
              onInput={value => setPcForm({ ...pcForm(), code: value })}
              placeholder="TWSP-FBS"
              required
            />
            <SettingsTextField
              label="Label"
              value={pcForm().label}
              onInput={value => setPcForm({ ...pcForm(), label: value })}
              placeholder="TWSP Food and Beverage"
              required
            />
            <SettingsTextField
              label="Fund Source"
              value={pcForm().fundSource ?? ""}
              onInput={value => setPcForm({ ...pcForm(), fundSource: value })}
              placeholder="TESDA"
            />
            <SettingsTextField
              label="Segment Group"
              value={pcForm().segmentGroup ?? ""}
              onInput={value => setPcForm({ ...pcForm(), segmentGroup: value })}
              placeholder="TWSP"
            />
            <SettingsNumberField
              label="Sort Order"
              value={pcForm().sortOrder ?? 0}
              onInput={value => setPcForm({ ...pcForm(), sortOrder: value })}
            />
          </SettingsFormGrid>
          <SettingsTextArea
            label="Notes"
            value={pcForm().notes ?? ""}
            onInput={value => setPcForm({ ...pcForm(), notes: value })}
          />
          <SettingsCheckbox
            checked={pcForm().active ?? true}
            onChange={active => setPcForm({ ...pcForm(), active })}
          />
          <SettingsStickyFooter>
            <ModalFooter
              onCancel={closePcModal}
              submitInForm
              submitLabel={editingPc() ? "Save" : "Create"}
              submitting={createProfitCenter.isPending || updateProfitCenter.isPending}
            />
          </SettingsStickyFooter>
        </SettingsModalForm>
      </Modal>

      <Modal
        open={offeringModalOpen()}
        onClose={closeOfferingModal}
        title={editingOffering() ? "Edit Training Offering" : "New Training Offering"}
        size="xl"
      >
        <SettingsModalForm onSubmit={submitOffering}>
          <SettingsFormGrid>
            <SettingsTextField
              label="Code"
              value={offeringForm().code}
              onInput={value => setOfferingForm({ ...offeringForm(), code: value })}
              placeholder="SMAW"
              required
            />
            <SettingsTextField
              label="Label"
              value={offeringForm().label}
              onInput={value => setOfferingForm({ ...offeringForm(), label: value })}
              placeholder="SMAW NC II"
              required
            />
            <SettingsTextField
              label="Sector"
              value={offeringForm().sector ?? ""}
              onInput={value => setOfferingForm({ ...offeringForm(), sector: value })}
              placeholder="Metals"
            />
            <SettingsNumberField
              label="Sort Order"
              value={offeringForm().sortOrder ?? 0}
              onInput={value => setOfferingForm({ ...offeringForm(), sortOrder: value })}
            />
          </SettingsFormGrid>
          <SettingsTextArea
            label="Notes"
            value={offeringForm().notes ?? ""}
            onInput={value => setOfferingForm({ ...offeringForm(), notes: value })}
          />
          <SettingsCheckbox
            checked={offeringForm().active ?? true}
            onChange={active => setOfferingForm({ ...offeringForm(), active })}
          />
          <SettingsStickyFooter>
            <ModalFooter
              onCancel={closeOfferingModal}
              submitInForm
              submitLabel={editingOffering() ? "Save" : "Create"}
              submitting={createOffering.isPending || updateOffering.isPending}
            />
          </SettingsStickyFooter>
        </SettingsModalForm>
      </Modal>

      <Modal
        open={ruleModalOpen()}
        onClose={closeRuleModal}
        title={editingRule() ? "Edit Auto-coding Rule" : "New Auto-coding Rule"}
        size="xl"
      >
        <SettingsModalForm onSubmit={submitRule}>
          <SettingsFormGrid>
            <SettingsTextField
              label="Account Code"
              value={ruleForm().glAccountCode}
              onInput={value => setRuleForm({ ...ruleForm(), glAccountCode: value })}
              placeholder="training_tools"
              required
            />
            <SettingsTextField
              label="Fund / Program"
              value={ruleForm().profitCenterCode}
              onInput={value => setRuleForm({ ...ruleForm(), profitCenterCode: value })}
              placeholder="TWSP-FBS"
            />
            <SettingsSelectField
              label="Default Expense Category"
              options={EXPENSE_CATEGORY_OPTIONS.slice(1)}
              value={ruleForm().defaultExpenseCategory}
              onChange={value => setRuleForm({ ...ruleForm(), defaultExpenseCategory: value })}
            />
            <SettingsSelectField
              label="Default Treatment"
              options={TREATMENT_OPTIONS.slice(1)}
              value={ruleForm().defaultAccountingTreatment}
              onChange={value => setRuleForm({ ...ruleForm(), defaultAccountingTreatment: value })}
            />
            <SettingsTextField
              label="Cost Type"
              value={ruleForm().defaultCostType}
              onInput={value => setRuleForm({ ...ruleForm(), defaultCostType: value })}
              placeholder="common"
            />
            <SettingsTextField
              label="Asset Category"
              value={ruleForm().defaultAssetCategory}
              onInput={value => setRuleForm({ ...ruleForm(), defaultAssetCategory: value })}
              placeholder="equipment"
            />
            <SettingsNumberField
              label="Useful Life Months"
              value={ruleForm().defaultUsefulLifeMonths ?? 0}
              onInput={value =>
                setRuleForm({ ...ruleForm(), defaultUsefulLifeMonths: value || undefined })
              }
            />
            <SettingsNumberField
              label="Sort Order"
              value={ruleForm().sortOrder}
              onInput={value => setRuleForm({ ...ruleForm(), sortOrder: value })}
            />
          </SettingsFormGrid>
          <SettingsTextArea
            label="Notes"
            value={ruleForm().notes}
            onInput={value => setRuleForm({ ...ruleForm(), notes: value })}
          />
          <div class="grid gap-2">
            <SettingsCheckbox
              checked={ruleForm().requiresAssetReview}
              onChange={requiresAssetReview => setRuleForm({ ...ruleForm(), requiresAssetReview })}
              label="Requires asset review"
            />
            <SettingsCheckbox
              checked={ruleForm().active}
              onChange={active => setRuleForm({ ...ruleForm(), active })}
            />
          </div>
          <SettingsStickyFooter>
            <ModalFooter
              onCancel={closeRuleModal}
              submitInForm
              submitLabel={editingRule() ? "Save" : "Create"}
              submitting={createRule.isPending || updateRule.isPending}
            />
          </SettingsStickyFooter>
        </SettingsModalForm>
      </Modal>

      <ConfirmDialog
        open={!!statusConfirm()}
        onClose={closeStatusConfirm}
        title={`${statusActionLabel()} ${statusConfirm()?.label ?? "setting"}?`}
        description={
          statusConfirm()?.active
            ? "This hides the setting from active finance choices without deleting historical records."
            : "This makes the setting available again in finance forms and reports."
        }
        confirmLabel={statusActionLabel()}
        danger={statusConfirm()?.active}
        pending={statusPending()}
        onConfirm={confirmStatusChange}
      />
    </PageContainer>
  )
}

function actionLabel(action: string) {
  if (action === "deactivate") return "Deactivated"
  if (action === "create") return "Created"
  if (action === "update") return "Updated"
  if (action === "delete") return "Deleted"
  return action
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
