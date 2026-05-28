import type { GlAccount, GlAccountSection } from "@ark/data-types"
import {
  DataTable,
  Modal,
  ModalFooter,
  PageContainer,
  PageHeader,
  Select,
  THead,
  Th,
  Tr,
  tonePillClass,
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
import type { JSX } from "solid-js"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { Icons, QueryBoundary } from "@/components/ui"

type SettingsTab = "accounts" | "profit-centers" | "offerings" | "rules" | "activity"

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

  const refreshAudit = () => void auditEvents.refetch()

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
        <StatCard label="Active account codes" value={activeGlAccounts()} />
        <StatCard label="Active funds/programs" value={activeProfitCenters()} />
        <StatCard label="Active offerings" value={activeOfferings()} />
        <StatCard label="Active rules" value={activeRules()} />
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
              <PanelHeader
                title="Account Codes"
                hint="Chart of accounts used by disbursements and reports"
                actionLabel="New Account"
                onAction={openCreateGl}
              />
              <QueryBoundary query={glAccounts}>
                {() => (
                  <ScrollableTable>
                    <DataTable>
                      <THead>
                        <Th size="compact">Code</Th>
                        <Th size="compact">Label</Th>
                        <Th size="compact">Section</Th>
                        <Th size="compact">Default Treatment</Th>
                        <Th size="compact">Status</Th>
                        <Th size="compact" align="right">
                          Actions
                        </Th>
                      </THead>
                      <tbody>
                        <For each={sortedGlAccounts()}>
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
                                <StatusPill active={acct.active} />
                              </td>
                              <td class="px-3 py-2 text-right whitespace-nowrap">
                                <RowButton onClick={() => openEditGl(acct)}>Edit</RowButton>
                                <Show when={acct.active}>
                                  <RowButton onClick={() => deactivateGl.mutate(acct.id)}>
                                    Deactivate
                                  </RowButton>
                                </Show>
                              </td>
                            </Tr>
                          )}
                        </For>
                      </tbody>
                    </DataTable>
                  </ScrollableTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "profit-centers"}>
              <PanelHeader
                title="Funds / Programs"
                hint="Profit centers and fund sources used by finance workflows"
                actionLabel="New Fund"
                onAction={openCreatePc}
              />
              <QueryBoundary query={profitCenters}>
                {() => (
                  <ScrollableTable>
                    <DataTable>
                      <THead>
                        <Th size="dense">Code</Th>
                        <Th size="dense">Label</Th>
                        <Th size="dense">Fund</Th>
                        <Th size="dense">Status</Th>
                        <Th size="dense" align="right">
                          Actions
                        </Th>
                      </THead>
                      <tbody>
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
                                <StatusPill active={item.active} />
                              </td>
                              <td class="py-3 px-4 text-right whitespace-nowrap">
                                <RowButton onClick={() => openEditPc(item)}>Edit</RowButton>
                                <RowButton
                                  onClick={() =>
                                    updateProfitCenter.mutate(
                                      { id: item.id, active: !item.active },
                                      { onSuccess: refreshAudit }
                                    )
                                  }
                                >
                                  {item.active ? "Deactivate" : "Restore"}
                                </RowButton>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </DataTable>
                  </ScrollableTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "offerings"}>
              <PanelHeader
                title="Training Offerings"
                hint="Program catalog used by training batches and reports"
                actionLabel="New Offering"
                onAction={openCreateOffering}
              />
              <QueryBoundary query={offerings}>
                {() => (
                  <ScrollableTable>
                    <DataTable>
                      <THead>
                        <Th size="dense">Code</Th>
                        <Th size="dense">Offering</Th>
                        <Th size="dense">Sector</Th>
                        <Th size="dense">Status</Th>
                        <Th size="dense" align="right">
                          Actions
                        </Th>
                      </THead>
                      <tbody>
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
                                <StatusPill active={item.active} />
                              </td>
                              <td class="py-3 px-4 text-right whitespace-nowrap">
                                <RowButton onClick={() => openEditOffering(item)}>Edit</RowButton>
                                <RowButton
                                  onClick={() =>
                                    updateOffering.mutate(
                                      { id: item.id, active: !item.active },
                                      { onSuccess: refreshAudit }
                                    )
                                  }
                                >
                                  {item.active ? "Deactivate" : "Restore"}
                                </RowButton>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </DataTable>
                  </ScrollableTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "rules"}>
              <PanelHeader
                title="Auto-coding Rules"
                hint="Defaults that reduce accounting choices in day-to-day forms"
                actionLabel="New Rule"
                onAction={openCreateRule}
              />
              <QueryBoundary query={rules}>
                {() => (
                  <ScrollableTable>
                    <DataTable>
                      <THead>
                        <Th size="dense">Account Code</Th>
                        <Th size="dense">Fund / Program</Th>
                        <Th size="dense">Defaults</Th>
                        <Th size="dense">Status</Th>
                        <Th size="dense" align="right">
                          Actions
                        </Th>
                      </THead>
                      <tbody>
                        <For each={sortedRules()}>
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
                                <StatusPill active={item.active} />
                              </td>
                              <td class="py-3 px-4 text-right whitespace-nowrap">
                                <RowButton onClick={() => openEditRule(item)}>Edit</RowButton>
                                <RowButton
                                  onClick={() =>
                                    updateRule.mutate(
                                      { id: item.id, active: !item.active },
                                      { onSuccess: refreshAudit }
                                    )
                                  }
                                >
                                  {item.active ? "Deactivate" : "Restore"}
                                </RowButton>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </DataTable>
                  </ScrollableTable>
                )}
              </QueryBoundary>
            </Match>

            <Match when={tab() === "activity"}>
              <PanelHeader
                title="Recent Settings Activity"
                hint="Latest finance setting and catalog changes"
              />
              <QueryBoundary query={auditEvents}>
                {result => (
                  <ScrollableTable>
                    <DataTable>
                      <THead>
                        <Th size="dense">When</Th>
                        <Th size="dense">Change</Th>
                        <Th size="dense">By</Th>
                      </THead>
                      <tbody>
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
                      </tbody>
                    </DataTable>
                  </ScrollableTable>
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
        <form onSubmit={submitGl} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Code"
              value={glForm().code}
              onInput={value => setGlForm({ ...glForm(), code: value })}
              placeholder="internet"
              required
              disabled={!!editingGl()}
            />
            <TextField
              label="Label"
              value={glForm().label}
              onInput={value => setGlForm({ ...glForm(), label: value })}
              placeholder="Internet Allowance"
              required
            />
            <SelectBox
              label="Section"
              options={SECTION_OPTIONS}
              value={glForm().section}
              onChange={value => setGlForm({ ...glForm(), section: value as GlAccountSection })}
            />
            <NumberField
              label="Sort Order"
              value={glForm().sortOrder ?? 0}
              onInput={value => setGlForm({ ...glForm(), sortOrder: value })}
            />
            <SelectBox
              label="Default Expense Category"
              options={EXPENSE_CATEGORY_OPTIONS}
              value={glForm().defaultExpenseCategory ?? ""}
              onChange={value => setGlForm({ ...glForm(), defaultExpenseCategory: value || null })}
            />
            <SelectBox
              label="Default Treatment"
              options={TREATMENT_OPTIONS}
              value={glForm().defaultAccountingTreatment ?? ""}
              onChange={value =>
                setGlForm({ ...glForm(), defaultAccountingTreatment: value || null })
              }
            />
          </div>
          <TextArea
            label="Notes"
            value={glForm().notes ?? ""}
            onInput={value => setGlForm({ ...glForm(), notes: value })}
          />
          <Show when={editingGl()}>
            <ActiveCheckbox
              checked={glForm().active ?? true}
              onChange={active => setGlForm({ ...glForm(), active })}
            />
          </Show>
          <ModalFooter
            onCancel={closeGlModal}
            submitInForm
            submitLabel={editingGl() ? "Save" : "Create"}
            submitting={createGl.isPending || updateGl.isPending}
          />
        </form>
      </Modal>

      <Modal
        open={pcModalOpen()}
        onClose={closePcModal}
        title={editingPc() ? "Edit Fund / Program" : "New Fund / Program"}
        size="xl"
      >
        <form onSubmit={submitPc} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Code"
              value={pcForm().code}
              onInput={value => setPcForm({ ...pcForm(), code: value })}
              placeholder="TWSP-FBS"
              required
            />
            <TextField
              label="Label"
              value={pcForm().label}
              onInput={value => setPcForm({ ...pcForm(), label: value })}
              placeholder="TWSP Food and Beverage"
              required
            />
            <TextField
              label="Fund Source"
              value={pcForm().fundSource ?? ""}
              onInput={value => setPcForm({ ...pcForm(), fundSource: value })}
              placeholder="TESDA"
            />
            <TextField
              label="Segment Group"
              value={pcForm().segmentGroup ?? ""}
              onInput={value => setPcForm({ ...pcForm(), segmentGroup: value })}
              placeholder="TWSP"
            />
            <NumberField
              label="Sort Order"
              value={pcForm().sortOrder ?? 0}
              onInput={value => setPcForm({ ...pcForm(), sortOrder: value })}
            />
          </div>
          <TextArea
            label="Notes"
            value={pcForm().notes ?? ""}
            onInput={value => setPcForm({ ...pcForm(), notes: value })}
          />
          <ActiveCheckbox
            checked={pcForm().active ?? true}
            onChange={active => setPcForm({ ...pcForm(), active })}
          />
          <ModalFooter
            onCancel={closePcModal}
            submitInForm
            submitLabel={editingPc() ? "Save" : "Create"}
            submitting={createProfitCenter.isPending || updateProfitCenter.isPending}
          />
        </form>
      </Modal>

      <Modal
        open={offeringModalOpen()}
        onClose={closeOfferingModal}
        title={editingOffering() ? "Edit Training Offering" : "New Training Offering"}
        size="xl"
      >
        <form onSubmit={submitOffering} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Code"
              value={offeringForm().code}
              onInput={value => setOfferingForm({ ...offeringForm(), code: value })}
              placeholder="SMAW"
              required
            />
            <TextField
              label="Label"
              value={offeringForm().label}
              onInput={value => setOfferingForm({ ...offeringForm(), label: value })}
              placeholder="SMAW NC II"
              required
            />
            <TextField
              label="Sector"
              value={offeringForm().sector ?? ""}
              onInput={value => setOfferingForm({ ...offeringForm(), sector: value })}
              placeholder="Metals"
            />
            <NumberField
              label="Sort Order"
              value={offeringForm().sortOrder ?? 0}
              onInput={value => setOfferingForm({ ...offeringForm(), sortOrder: value })}
            />
          </div>
          <TextArea
            label="Notes"
            value={offeringForm().notes ?? ""}
            onInput={value => setOfferingForm({ ...offeringForm(), notes: value })}
          />
          <ActiveCheckbox
            checked={offeringForm().active ?? true}
            onChange={active => setOfferingForm({ ...offeringForm(), active })}
          />
          <ModalFooter
            onCancel={closeOfferingModal}
            submitInForm
            submitLabel={editingOffering() ? "Save" : "Create"}
            submitting={createOffering.isPending || updateOffering.isPending}
          />
        </form>
      </Modal>

      <Modal
        open={ruleModalOpen()}
        onClose={closeRuleModal}
        title={editingRule() ? "Edit Auto-coding Rule" : "New Auto-coding Rule"}
        size="xl"
      >
        <form onSubmit={submitRule} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Account Code"
              value={ruleForm().glAccountCode}
              onInput={value => setRuleForm({ ...ruleForm(), glAccountCode: value })}
              placeholder="training_tools"
              required
            />
            <TextField
              label="Fund / Program"
              value={ruleForm().profitCenterCode}
              onInput={value => setRuleForm({ ...ruleForm(), profitCenterCode: value })}
              placeholder="TWSP-FBS"
            />
            <SelectBox
              label="Default Expense Category"
              options={EXPENSE_CATEGORY_OPTIONS.slice(1)}
              value={ruleForm().defaultExpenseCategory}
              onChange={value => setRuleForm({ ...ruleForm(), defaultExpenseCategory: value })}
            />
            <SelectBox
              label="Default Treatment"
              options={TREATMENT_OPTIONS.slice(1)}
              value={ruleForm().defaultAccountingTreatment}
              onChange={value => setRuleForm({ ...ruleForm(), defaultAccountingTreatment: value })}
            />
            <TextField
              label="Cost Type"
              value={ruleForm().defaultCostType}
              onInput={value => setRuleForm({ ...ruleForm(), defaultCostType: value })}
              placeholder="common"
            />
            <TextField
              label="Asset Category"
              value={ruleForm().defaultAssetCategory}
              onInput={value => setRuleForm({ ...ruleForm(), defaultAssetCategory: value })}
              placeholder="equipment"
            />
            <NumberField
              label="Useful Life Months"
              value={ruleForm().defaultUsefulLifeMonths ?? 0}
              onInput={value =>
                setRuleForm({ ...ruleForm(), defaultUsefulLifeMonths: value || undefined })
              }
            />
            <NumberField
              label="Sort Order"
              value={ruleForm().sortOrder}
              onInput={value => setRuleForm({ ...ruleForm(), sortOrder: value })}
            />
          </div>
          <TextArea
            label="Notes"
            value={ruleForm().notes}
            onInput={value => setRuleForm({ ...ruleForm(), notes: value })}
          />
          <div class="grid gap-2">
            <ActiveCheckbox
              checked={ruleForm().requiresAssetReview}
              onChange={requiresAssetReview => setRuleForm({ ...ruleForm(), requiresAssetReview })}
              label="Requires asset review"
            />
            <ActiveCheckbox
              checked={ruleForm().active}
              onChange={active => setRuleForm({ ...ruleForm(), active })}
            />
          </div>
          <ModalFooter
            onCancel={closeRuleModal}
            submitInForm
            submitLabel={editingRule() ? "Save" : "Create"}
            submitting={createRule.isPending || updateRule.isPending}
          />
        </form>
      </Modal>
    </PageContainer>
  )
}

function StatCard(props: { label: string; value: number }) {
  return (
    <div class="bg-surface border border-border rounded-lg px-4 py-3">
      <p class="text-xs text-muted">{props.label}</p>
      <p class="text-2xl font-semibold text-foreground tabular-nums mt-1">{props.value}</p>
    </div>
  )
}

function PanelHeader(props: {
  title: string
  hint: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 class="text-base font-semibold text-foreground">{props.title}</h2>
        <p class="text-xs text-muted mt-0.5">{props.hint}</p>
      </div>
      <Show when={props.actionLabel && props.onAction}>
        <button
          type="button"
          onClick={props.onAction}
          class="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <Icons.plus class="w-4 h-4" /> {props.actionLabel}
        </button>
      </Show>
    </div>
  )
}

function ScrollableTable(props: { children: JSX.Element }) {
  return (
    <div class="border border-border rounded-lg overflow-auto max-h-[520px]">{props.children}</div>
  )
}

function StatusPill(props: { active: boolean }) {
  return (
    <Show
      when={props.active}
      fallback={
        <span class={`text-xs px-2 py-0.5 rounded ${tonePillClass("negative")}`}>Inactive</span>
      }
    >
      <span class={`text-xs px-2 py-0.5 rounded ${tonePillClass("positive")}`}>Active</span>
    </Show>
  )
}

function RowButton(props: { onClick: () => void; children: JSX.Element }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class="text-xs font-medium text-muted hover:text-primary px-2"
    >
      {props.children}
    </button>
  )
}

function TextField(props: {
  label: string
  value: string
  onInput: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <label class="grid gap-1">
      <span class="text-sm font-medium text-foreground">{props.label}</span>
      <input
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-muted"
      />
    </label>
  )
}

function NumberField(props: { label: string; value: number; onInput: (value: number) => void }) {
  return (
    <label class="grid gap-1">
      <span class="text-sm font-medium text-foreground">{props.label}</span>
      <input
        type="number"
        value={props.value}
        onInput={e => props.onInput(Number(e.currentTarget.value) || 0)}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </label>
  )
}

function TextArea(props: { label: string; value: string; onInput: (value: string) => void }) {
  return (
    <label class="grid gap-1">
      <span class="text-sm font-medium text-foreground">{props.label}</span>
      <textarea
        rows={2}
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </label>
  )
}

function SelectBox(props: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <div>
      <span class="block text-sm font-medium text-foreground mb-1">{props.label}</span>
      <Select
        options={props.options}
        value={props.value}
        onChange={props.onChange}
        ariaLabel={props.label}
      />
    </div>
  )
}

function ActiveCheckbox(props: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label class="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={e => props.onChange(e.currentTarget.checked)}
      />
      <span class="text-foreground">{props.label ?? "Active"}</span>
    </label>
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
