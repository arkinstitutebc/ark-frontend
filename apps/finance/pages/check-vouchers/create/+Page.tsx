import { useCreateCheckVoucher } from "@data/hooks"
import { navigate } from "vike/client/router"
import {
  CheckVoucherForm,
  type CheckVoucherFormValues,
} from "@/components/finance/check-voucher-form"

const today = () => new Date().toISOString().slice(0, 10)

export default function CreateCheckVoucherPage() {
  const createVoucher = useCreateCheckVoucher()
  const initialValues: CheckVoucherFormValues = {
    voucherDate: today(),
    payee: "",
    bankName: "Security Bank",
    paymentLines: [],
    debitLines: [],
    creditLines: [{ account: "Cash in bank - SB", amount: 0 }],
    preparedBy: "APRIL HEART A. ESCARO",
    approvedBy: "GEMMA A. ESCARO",
  }

  return (
    <CheckVoucherForm
      initialValues={initialValues}
      title="New Check Voucher"
      subtitle="Record payment items and the balanced accounting entry for printing."
      submitLabel="Save Voucher"
      pending={createVoucher.isPending}
      error={createVoucher.error}
      onCancel={() => navigate("/check-vouchers")}
      onSubmit={values =>
        createVoucher.mutate(values, { onSuccess: () => navigate("/check-vouchers") })
      }
    />
  )
}
