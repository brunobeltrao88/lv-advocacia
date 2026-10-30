"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarcarPagoButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function marcarPago() {
    setLoading(true);
    try {
      await fetch("/api/financeiro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PAGO", dataPagamento: new Date().toISOString() }),
      });
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <button
      onClick={marcarPago}
      disabled={loading}
      className="rounded px-2 py-1 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "..." : "Marcar pago"}
    </button>
  );
}
