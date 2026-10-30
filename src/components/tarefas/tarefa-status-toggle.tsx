"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";

export function TarefaStatusToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const done = status === "CONCLUIDA";

  async function toggle() {
    await fetch(`/api/tarefas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: done ? "PENDENTE" : "CONCLUIDA" }),
    });
    router.refresh();
  }

  return (
    <button onClick={toggle} className={`transition-colors ${done ? "text-green-500" : "text-stone-300 hover:text-stone-500"}`}>
      {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
    </button>
  );
}
