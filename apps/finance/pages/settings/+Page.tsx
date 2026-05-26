import { DataTable, PageContainer, PageHeader, THead, Th } from "@ark/ui"
import {
  useClassificationRules,
  useCreateClassificationRule,
  useCreateProfitCenter,
  useCreateTrainingOffering,
  useProfitCenters,
  useTrainingOfferings,
  useUpdateClassificationRule,
  useUpdateProfitCenter,
  useUpdateTrainingOffering,
} from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { Icons, QueryBoundary } from "@/components/ui"

export default function FinanceSettingsPage() {
  const profitCenters = useProfitCenters(() => ({ includeInactive: true }))
  const offerings = useTrainingOfferings(() => ({ includeInactive: true }))
  const rules = useClassificationRules(() => ({ includeInactive: true }))

  const createProfitCenter = useCreateProfitCenter()
  const updateProfitCenter = useUpdateProfitCenter()
  const createOffering = useCreateTrainingOffering()
  const updateOffering = useUpdateTrainingOffering()
  const createRule = useCreateClassificationRule()
  const updateRule = useUpdateClassificationRule()

  const [pcCode, setPcCode] = createSignal("")
  const [pcLabel, setPcLabel] = createSignal("")
  const [pcFund, setPcFund] = createSignal("")
  const [offeringCode, setOfferingCode] = createSignal("")
  const [offeringLabel, setOfferingLabel] = createSignal("")
  const [offeringSector, setOfferingSector] = createSignal("")
  const [ruleCategory, setRuleCategory] = createSignal("")
  const [ruleTreatment, setRuleTreatment] = createSignal("variable")
  const [ruleExpenseCategory, setRuleExpenseCategory] = createSignal("cost-of-services")

  const addProfitCenter = (e: Event) => {
    e.preventDefault()
    if (!pcCode().trim() || !pcLabel().trim()) return
    createProfitCenter.mutate(
      {
        code: pcCode().trim(),
        label: pcLabel().trim(),
        fundSource: pcFund().trim() || undefined,
      },
      {
        onSuccess: () => {
          setPcCode("")
          setPcLabel("")
          setPcFund("")
        },
      }
    )
  }

  const addOffering = (e: Event) => {
    e.preventDefault()
    if (!offeringCode().trim() || !offeringLabel().trim()) return
    createOffering.mutate(
      {
        code: offeringCode().trim(),
        label: offeringLabel().trim(),
        sector: offeringSector().trim() || undefined,
      },
      {
        onSuccess: () => {
          setOfferingCode("")
          setOfferingLabel("")
          setOfferingSector("")
        },
      }
    )
  }

  const addRule = (e: Event) => {
    e.preventDefault()
    if (!ruleCategory().trim()) return
    createRule.mutate(
      {
        glAccountCode: ruleCategory().trim(),
        defaultExpenseCategory: ruleExpenseCategory(),
        defaultAccountingTreatment: ruleTreatment(),
        requiresAssetReview: ruleTreatment() === "capital",
      },
      {
        onSuccess: () => {
          setRuleCategory("")
          setRuleTreatment("variable")
          setRuleExpenseCategory("cost-of-services")
        },
      }
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Finance Settings"
        subtitle="Manage fund sources, training offerings, and category defaults"
      />

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section class="bg-surface border border-border rounded-lg overflow-hidden">
          <SettingsHeader title="Profit Centers" hint="Fund sources and P&L groups" />
          <form onSubmit={addProfitCenter} class="p-4 border-b border-border grid gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input label="Code" value={pcCode()} onInput={setPcCode} placeholder="STEP" />
              <Input label="Label" value={pcLabel()} onInput={setPcLabel} placeholder="STEP" />
              <Input label="Fund" value={pcFund()} onInput={setPcFund} placeholder="TESDA" />
            </div>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors justify-self-start"
            >
              <Icons.plus class="w-4 h-4" /> Add
            </button>
          </form>
          <QueryBoundary query={profitCenters}>
            {items => (
              <DataTable>
                <THead>
                  <Th size="dense">Code</Th>
                  <Th size="dense">Label</Th>
                  <Th size="dense">Active</Th>
                </THead>
                <tbody>
                  <For each={items}>
                    {item => (
                      <tr class="border-t border-border">
                        <td class="py-3 px-4 text-sm font-mono text-foreground">{item.code}</td>
                        <td class="py-3 px-4 text-sm text-foreground">
                          {item.label}
                          <Show when={item.fundSource}>
                            <span class="block text-xs text-muted">{item.fundSource}</span>
                          </Show>
                        </td>
                        <td class="py-3 px-4">
                          <Toggle
                            checked={item.active}
                            onChange={active => updateProfitCenter.mutate({ id: item.id, active })}
                          />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </DataTable>
            )}
          </QueryBoundary>
        </section>

        <section class="bg-surface border border-border rounded-lg overflow-hidden">
          <SettingsHeader title="Training Offerings" hint="Programs available for batches" />
          <form onSubmit={addOffering} class="p-4 border-b border-border grid gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                label="Code"
                value={offeringCode()}
                onInput={setOfferingCode}
                placeholder="SMAW"
              />
              <Input
                label="Label"
                value={offeringLabel()}
                onInput={setOfferingLabel}
                placeholder="SMAW NC II"
              />
              <Input
                label="Sector"
                value={offeringSector()}
                onInput={setOfferingSector}
                placeholder="Metals"
              />
            </div>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors justify-self-start"
            >
              <Icons.plus class="w-4 h-4" /> Add
            </button>
          </form>
          <QueryBoundary query={offerings}>
            {items => (
              <DataTable>
                <THead>
                  <Th size="dense">Code</Th>
                  <Th size="dense">Offering</Th>
                  <Th size="dense">Active</Th>
                </THead>
                <tbody>
                  <For each={items}>
                    {item => (
                      <tr class="border-t border-border">
                        <td class="py-3 px-4 text-sm font-mono text-foreground">{item.code}</td>
                        <td class="py-3 px-4 text-sm text-foreground">
                          {item.label}
                          <Show when={item.sector}>
                            <span class="block text-xs text-muted">{item.sector}</span>
                          </Show>
                        </td>
                        <td class="py-3 px-4">
                          <Toggle
                            checked={item.active}
                            onChange={active => updateOffering.mutate({ id: item.id, active })}
                          />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </DataTable>
            )}
          </QueryBoundary>
        </section>

        <section class="bg-surface border border-border rounded-lg overflow-hidden">
          <SettingsHeader title="Classification Rules" hint="Defaults behind simple categories" />
          <form onSubmit={addRule} class="p-4 border-b border-border grid gap-3">
            <Input
              label="Category code"
              value={ruleCategory()}
              onInput={setRuleCategory}
              placeholder="training_tools"
            />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SelectField
                label="Expense"
                value={ruleExpenseCategory()}
                onInput={setRuleExpenseCategory}
                options={["cost-of-services", "admin-expense", "fixed-asset"]}
              />
              <SelectField
                label="Treatment"
                value={ruleTreatment()}
                onInput={setRuleTreatment}
                options={["variable", "traceable-fixed", "common-overhead", "capital"]}
              />
            </div>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors justify-self-start"
            >
              <Icons.plus class="w-4 h-4" /> Add
            </button>
          </form>
          <QueryBoundary query={rules}>
            {items => (
              <DataTable>
                <THead>
                  <Th size="dense">Category</Th>
                  <Th size="dense">Defaults</Th>
                  <Th size="dense">Active</Th>
                </THead>
                <tbody>
                  <For each={items}>
                    {item => (
                      <tr class="border-t border-border">
                        <td class="py-3 px-4 text-sm font-mono text-foreground">
                          {item.glAccountCode}
                        </td>
                        <td class="py-3 px-4 text-xs text-muted">
                          <span class="block text-foreground">
                            {item.defaultExpenseCategory ?? "—"}
                          </span>
                          {item.defaultAccountingTreatment ?? "—"}
                        </td>
                        <td class="py-3 px-4">
                          <Toggle
                            checked={item.active}
                            onChange={active => updateRule.mutate({ id: item.id, active })}
                          />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </DataTable>
            )}
          </QueryBoundary>
        </section>
      </div>
    </PageContainer>
  )
}

function SettingsHeader(props: { title: string; hint: string }) {
  return (
    <div class="px-4 py-3 border-b border-border">
      <h2 class="text-sm font-semibold text-foreground">{props.title}</h2>
      <p class="text-xs text-muted mt-0.5">{props.hint}</p>
    </div>
  )
}

function Input(props: {
  label: string
  value: string
  onInput: (value: string) => void
  placeholder?: string
}) {
  return (
    <label class="grid gap-1">
      <span class="text-xs font-medium text-muted">{props.label}</span>
      <input
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        placeholder={props.placeholder}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </label>
  )
}

function SelectField(props: {
  label: string
  value: string
  onInput: (value: string) => void
  options: string[]
}) {
  return (
    <label class="grid gap-1">
      <span class="text-xs font-medium text-muted">{props.label}</span>
      <select
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <For each={props.options}>{option => <option value={option}>{option}</option>}</For>
      </select>
    </label>
  )
}

function Toggle(props: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.checked)}
      class={`h-6 w-10 rounded-full border transition-colors ${props.checked ? "bg-primary border-primary" : "bg-surface-muted border-border"}`}
      aria-pressed={props.checked}
      title={props.checked ? "Active" : "Inactive"}
    >
      <span
        class={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${props.checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  )
}
