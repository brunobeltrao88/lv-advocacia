"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const AREAS = ["CIVIL", "TRABALHISTA", "CRIMINAL", "TRIBUTARIO", "FAMILIA", "PREVIDENCIARIO", "EMPRESARIAL", "OUTRO"];
const AREA_LABELS: Record<string, string> = { CIVIL: "Civil", TRABALHISTA: "Trabalhista", CRIMINAL: "Criminal", TRIBUTARIO: "Tributário", FAMILIA: "Família", PREVIDENCIARIO: "Previdenciário", EMPRESARIAL: "Empresarial", OUTRO: "Outro" };

type Cliente = { id: string; nome: string; tipo: string };

export default function NovoProcessoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [form, setForm] = useState({
    titulo: "",
    clienteId: "",
    area: "CIVIL",
    numeroCNJ: "",
    vara: "",
    comarca: "",
    tribunal: "",
    uf: "",
    valorCausa: "",
    descricao: "",
    dataDistribuicao: "",
    primeiroAndamento: "",
  });

  useEffect(() => {
    fetch("/api/clientes").then(r => r.json()).then(d => setClientes(Array.isArray(d) ? d : []));
  }, []);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.clienteId) return setError("Título e cliente são obrigatórios.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valorCausa: form.valorCausa ? parseFloat(form.valorCausa.replace(",", ".")) : null,
          dataDistribuicao: form.dataDistribuicao || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao criar processo");
        return;
      }
      const data = await res.json();
      router.push(`/processos/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  const field = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full";
  const label = "block text-xs font-medium text-stone-600 mb-1";

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center gap-3">
          <Link href="/processos" className="text-stone-400 hover:text-stone-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Novo processo</h1>
            <p className="text-sm text-stone-500">Preencha os dados do processo</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <form onSubmit={submit} className="max-w-2xl space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Informações principais</h2>

            <div>
              <label className={label}>Título do processo *</label>
              <input className={field} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ex: João Silva vs Empresa X" required />
            </div>

            <div>
              <label className={label}>Cliente *</label>
              <select className={field} value={form.clienteId} onChange={e => set("clienteId", e.target.value)} required>
                <option value="">Selecione um cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Área do direito</label>
                <select className={field} value={form.area} onChange={e => set("area", e.target.value)}>
                  {AREAS.map(a => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Número CNJ</label>
                <input className={field} value={form.numeroCNJ} onChange={e => set("numeroCNJ", e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
              </div>
            </div>

            <div>
              <label className={label}>Descrição</label>
              <textarea className={field} rows={3} value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Breve descrição do processo..." />
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Dados judiciais</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Vara</label>
                <input className={field} value={form.vara} onChange={e => set("vara", e.target.value)} placeholder="Ex: 3ª Vara do Trabalho" />
              </div>
              <div>
                <label className={label}>Comarca</label>
                <input className={field} value={form.comarca} onChange={e => set("comarca", e.target.value)} placeholder="Ex: São Paulo" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Tribunal</label>
                <input className={field} value={form.tribunal} onChange={e => set("tribunal", e.target.value)} placeholder="Ex: TRT-2" />
              </div>
              <div>
                <label className={label}>UF</label>
                <input className={field} value={form.uf} onChange={e => set("uf", e.target.value)} placeholder="SP" maxLength={2} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Valor da causa (R$)</label>
                <input className={field} value={form.valorCausa} onChange={e => set("valorCausa", e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <label className={label}>Data de distribuição</label>
                <input type="date" className={field} value={form.dataDistribuicao} onChange={e => set("dataDistribuicao", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Primeiro andamento</h2>
            <div>
              <label className={label}>Descrição do andamento inicial</label>
              <textarea className={field} rows={3} value={form.primeiroAndamento} onChange={e => set("primeiroAndamento", e.target.value)} placeholder="Ex: Distribuição da ação, citação do réu..." />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
              {loading ? "Criando..." : "Criar processo"}
            </button>
            <Link href="/processos" className="rounded-lg border border-stone-200 px-6 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
