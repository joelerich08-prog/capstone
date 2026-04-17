"use client"

import { POSTerminal } from "@/components/pos/pos-terminal"
import { StockmanShell } from "@/components/layout/stockman-shell"

export default function StockmanPOSPage() {
  return (
    <StockmanShell title="POS Terminal (View Only)" description="View POS interface for monitoring and training">
      <div className="space-y-4">
        <div className="bg-muted/50 border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center text-muted-foreground">
          <p className="text-sm">
            This is a view-only POS interface for stockman monitoring and training purposes.
            Transaction processing is restricted to cashier role only.
          </p>
        </div>
        <POSTerminal readOnly={true} />
      </div>
    </StockmanShell>
  )
}