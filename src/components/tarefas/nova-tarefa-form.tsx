"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Processo = { id: string; titulo: string };
type User = { id: string; name: string };

export function NovaTarefaForm({ processos, users }: { processos: Processo[]; users: User[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    processoId: "",
    responsavelId: "",
    prioridade: "NORMAL",
    prazo: "",
  });

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          processoId: form.processoId || null,
          responsavelId: form.responsavelId || null,
          prazo: form.prazo || null,
        }),
      });
      router.push("/tarefas");
      router.refresh();
    } finally { setLoading(false); }
  }

  const field = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none w-full";
  const lbl = "block text-xs font-medium text-stone-600 mb-1";

  return (
    <div className="border-b border-stone-200 bg-amber-50/60 px-8 py-5">
      <form onSubmit={submit} className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-700">Nova tarefa</h3>
          <button type="button" onClick={() => router.push("/tarefas")} className="text-stone-400 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={lbl}>Título *</label>
            <input className={field} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Descreva a tarefa..." required autoFocus />
          </div>
          <div>
            <label className={lbl}>Processo</label>
            <select className={field} value={form.processoId} onChange={e => set("processoId", e.target.value)}>
              <option value="">Sem processo</option>
              {processos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Responsável</label>
            <select className={field} value={form.responsavelId} onChange={e => set("responsavelId", e.target.value)}>
              <option value="">Não atribuído</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Prioridade</label>
            <select className={field} value={form.prioridade} onChange={e => set("prioridade", e.target.value)}>
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Prazo</label>
            <input type="date" className={field} value={form.prazo} onChange={e => set("prazo", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Descrição</label>
            <input className={field} value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Detalhes opcionais..." />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
            {loading ? "Salvando..." : "Criar tarefa"}
          </button>
          <button type="button" onClick={() => router.push("/tarefas")} className="rounded-lg border border-stone-200 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
