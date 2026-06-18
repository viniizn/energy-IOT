import { useEffect, useState } from "react";
import { SHARED_TYPES_VERSION } from "@energy-monitor/shared-types";

type HealthResponse = { status: string; service: string; timestamp: string };

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError("Não foi possível conectar ao backend ainda."));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-xl font-semibold">Energy Monitor — setup do monorepo</h1>
        <p className="text-sm text-slate-400">
          shared-types versão <code className="text-emerald-400">{SHARED_TYPES_VERSION}</code>
        </p>
        {health && <p className="text-sm text-emerald-400">Backend respondeu: {health.status}</p>}
        {error && <p className="text-sm text-amber-400">{error}</p>}
        {!health && !error && <p className="text-sm text-slate-500">Verificando conexão...</p>}
      </div>
    </main>
  );
}

export default App;