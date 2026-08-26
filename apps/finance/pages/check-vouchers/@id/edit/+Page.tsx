import type { CheckVoucher } from "@ark/data-types"
import { Button, QueryBoundary } from "@ark/ui"
import { useCheckVoucher, useCurrentUser, useUpdateCheckVoucher } from "@data/hooks"
import { createMemo, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { usePageContext } from "vike-solid/usePageContext"
import {
  CheckVoucherForm,
  type CheckVoucherFormValues,
} from "@/components/finance/check-voucher-form"

const CHECK_VOUCHER_EDITOR_EMAIL = "heart@arkinstitutebc.com"

export default function EditCheckVoucherPage() {
  const context = usePageContext()
  const id = createMemo(() => context.routeParams.id as string)
  const currentUser = useCurrentUser()
  const voucherQuery = useCheckVoucher(id)
  const updateVoucher = useUpdateCheckVoucher()
  const canEdit = createMemo(
    () => currentUser.data?.email.trim().toLowerCase() === CHECK_VOUCHER_EDITOR_EMAIL
  )

  return (
    <Show
      when={currentUser.data}
      fallback={
        <div class="mx-auto mt-12 h-64 max-w-6xl animate-pulse rounded-lg bg-surface-muted" />
      }
    >
      <Show
        when={canEdit()}
        fallback={
          <AccessMessage
            title="Editing is restricted"
            message="Only Heart can edit saved check vouchers."
          />
        }
      >
        <QueryBoundary query={voucherQuery}>
          {voucher => (
            <Show
              when={voucher.status !== "void"}
              fallback={
                <AccessMessage
                  title="Void voucher"
                  message="Void check vouchers cannot be edited."
                />
              }
            >
              <CheckVoucherForm
                initialValues={voucherValues(voucher)}
                title={`Edit Check Voucher ${voucher.voucherNo}`}
                subtitle="Update the saved voucher. Its workflow status will not change."
                submitLabel="Save Changes"
                voucherNumberRequired
                warning={
                  voucher.status === "draft"
                    ? undefined
                    : `This voucher is ${voucher.status}. Changes will be recorded in the audit log.`
                }
                pending={updateVoucher.isPending}
                error={updateVoucher.error}
                onCancel={() => navigate("/check-vouchers")}
                onSubmit={values =>
                  updateVoucher.mutate(
                    { ...values, id: voucher.id, voucherNo: values.voucherNo ?? "" },
                    { onSuccess: () => navigate("/check-vouchers") }
                  )
                }
              />
            </Show>
          )}
        </QueryBoundary>
      </Show>
    </Show>
  )
}

function voucherValues(voucher: CheckVoucher) {
  return {
    voucherNo: voucher.voucherNo,
    voucherDate: voucher.voucherDate.slice(0, 10),
    payee: voucher.payee,
    address: voucher.address ?? undefined,
    bankName: voucher.bankName,
    checkNo: voucher.checkNo ?? undefined,
    paymentLines: voucher.paymentLines,
    debitLines: voucher.debitLines,
    creditLines: voucher.creditLines,
    preparedBy: voucher.preparedBy ?? undefined,
    approvedBy: voucher.approvedBy ?? undefined,
    receivedBy: voucher.receivedBy ?? undefined,
  } satisfies CheckVoucherFormValues
}

function AccessMessage(props: { title: string; message: string }) {
  return (
    <div class="mx-auto mt-12 max-w-lg rounded-lg border border-border bg-surface p-8 text-center">
      <h1 class="text-xl font-semibold text-foreground">{props.title}</h1>
      <p class="mt-2 text-sm text-muted">{props.message}</p>
      <Button type="button" size="sm" class="mt-6" onClick={() => navigate("/check-vouchers")}>
        Back to Check Vouchers
      </Button>
    </div>
  )
}
