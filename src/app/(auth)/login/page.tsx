"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Scale } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@lv.adv.br");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao fazer login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-stone-800 border border-stone-700 p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600">
          <Scale className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso ao sistema</h2>
        <p className="mt-1 text-sm text-stone-400">L&V Advocacia</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-300">E-mail</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full rounded-lg border border-stone-600 bg-stone-700 px-3 py-2 text-sm text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-300">Senha</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-lg border border-stone-600 bg-stone-700 px-3 py-2 pr-10 text-sm text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full mt-2">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-stone-500">
        admin@lv.adv.br · admin123
      </p>
    </div>
  );
}
