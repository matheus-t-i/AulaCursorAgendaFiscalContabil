import { Link, useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';

type LocationState = {
  email?: string;
};

export function AguardandoAprovacaoPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;
  const email = state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg text-fg p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
          <Clock size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Aguardando aprovação do gestor</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Seu pedido de reativação foi registrado
            {email ? (
              <>
                {' '}
                para <span className="font-medium text-fg">{email}</span>
              </>
            ) : null}
            . Assim que um gestor aprovar, você poderá entrar normalmente com a nova senha
            informada.
          </p>
        </div>
        <div className="text-sm text-muted bg-surface border border-border rounded-xl px-4 py-3 text-left space-y-1">
          <p>Enquanto isso, o acesso permanece bloqueado.</p>
          <p>Se o pedido for recusado, a conta continua inativa.</p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-accent text-accent-fg font-medium hover:opacity-90"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
