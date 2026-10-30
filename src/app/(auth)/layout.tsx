export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stone-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-stone-900 px-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600 mb-6">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">L&V Advocacia</h1>
        <p className="text-stone-400 text-base max-w-xs">
          Sistema de gestão jurídica — processos, clientes, prazos e financeiro em um só lugar.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 text-left w-full max-w-xs">
          {["Gestão de Processos", "Controle de Prazos", "CRM de Clientes", "Financeiro"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
