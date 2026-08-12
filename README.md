# Agenda Fiscal Contábil — Painel Web

Painel de gestão que cruza agenda fiscal, tarefas por colaborador, atrasos com risco de multa e rendimento da equipe.

## Stack

- **Painel:** React + Vite + Tailwind + TanStack Query + Recharts

## Como subir

A API e o banco ficam no repositório separado: [AulaBSSP-api](https://github.com/matheus-t-i/AulaBSSP-api).

```bash
# Com a API rodando em http://localhost:3001
npm install
npm run dev
```

- Painel: http://localhost:5173

## Login demo

| Usuário | E-mail | Senha | Papel |
|---------|--------|-------|-------|
| Ana Gestora | ana@escritorio.com | senha123 | GESTOR |
| Bruno Fiscal | bruno@escritorio.com | senha123 | COLABORADOR |
| Carla Contábil | carla@escritorio.com | senha123 | COLABORADOR |
| Diego DP | diego@escritorio.com | senha123 | COLABORADOR |

Também é possível entrar pela tela de login escolhendo um usuário no acesso rápido (demo).
