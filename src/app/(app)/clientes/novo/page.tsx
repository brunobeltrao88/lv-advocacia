"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tipo: "PF",
    nome: "",
    cpfCnpj: "",
    email: "",
    telefone: "",
    celular: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
  });

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome) return setError("Nome é obrigatório.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
      const data = await res.json();
      router.push(`/clientes/${data.id}`);
    } finally { setLoading(false); }
  }

  const field = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none w-full";
  const lbl = "block text-xs font-medium text-stone-600 mb-1";

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="text-stone-400 hover:text-stone-700"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Novo cliente</h1>
            <p className="text-sm text-stone-500">Cadastrar pessoa física ou jurídica</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <form onSubmit={submit} className="max-w-2xl space-y-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Dados principais</h2>

            <div>
              <label className={lbl}>Tipo</label>
              <div className="flex gap-3">
                {["PF", "PJ"].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipo" value={t} checked={form.tipo === t} onChange={() => set("tipo", t)} className="accent-amber-600" />
                    <span className="text-sm text-stone-700">{t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={lbl}>{form.tipo === "PJ" ? "Razão Social *" : "Nome completo *"}</label>
              <input className={field} value={form.nome} onChange={e => set("nome", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{form.tipo === "PJ" ? "CNPJ" : "CPF"}</label>
                <input className={field} value={form.cpfCnpj} onChange={e => set("cpfCnpj", e.target.value)} placeholder={form.tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"} />
              </div>
              <div>
                <label className={lbl}>E-mail</label>
                <input type="email" className={field} value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Telefone</label>
                <input className={field} value={form.telefone} onChange={e => set("telefone", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Celular</label>
                <input className={field} value={form.celular} onChange={e => set("celular", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Endereço</h2>

            <div>
              <label className={lbl}>Endereço</label>
              <input className={field} value={form.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Rua, número, complemento" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Cidade</label>
                <input className={field} value={form.cidade} onChange={e => set("cidade", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>UF</label>
                <input className={field} value={form.estado} onChange={e => set("estado", e.target.value)} maxLength={2} placeholder="SP" />
              </div>
            </div>
            <div className="w-40">
              <label className={lbl}>CEP</label>
              <input className={field} value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Observações</h2>
            <textarea className={field} rows={3} value={form.observacoes} onChange={e => set("observacoes", e.target.value)} />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {loading ? "Salvando..." : "Cadastrar cliente"}
            </button>
            <Link href="/clientes" className="rounded-lg border border-stone-200 px-6 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
