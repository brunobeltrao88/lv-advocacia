"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const TIPOS = ["GERAL", "AUDIENCIA", "DESPACHO", "SENTENCA", "RECURSO", "INTIMACAO", "PETICAO"];
const TIPO_LABEL: Record<string, string> = { GERAL: "Geral", AUDIENCIA: "Audiência", DESPACHO: "Despacho", SENTENCA: "Sentença", RECURSO: "Recurso", INTIMACAO: "Intimação", PETICAO: "Petição" };

export function AddAndamentoForm({ processoId }: { processoId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("GERAL");
  const [descricao, setDescricao] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/processos/${processoId}/andamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, descricao }),
      });
      setDescricao("");
      setTipo("GERAL");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500 hover:border-amber-400 hover:text-amber-600 transition-colors w-full"
      >
        <Plus className="h-4 w-4" /> Adicionar andamento
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        >
          {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
      </div>
      <textarea
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        rows={3}
        placeholder="Descreva o andamento..."
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button type="submit" disabled={loading || !descricao.trim()} className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
          {loading ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-stone-200 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
