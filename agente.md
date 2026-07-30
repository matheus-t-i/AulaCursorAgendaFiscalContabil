# Agente — Agenda Fiscal Contábil

## Responsividade

O sistema deve ser responsivo e funcionar bem em **web (desktop)** e **mobile**.

- Layouts, tipografia, espaçamentos e componentes devem se adaptar a diferentes larguras de tela.
- Novas telas e componentes devem ser pensados mobile-first ou com breakpoints claros.
- Evitar overflow horizontal, elementos cortados ou áreas clicáveis ruins no celular.
- Tabelas, formulários, navegação e gráficos devem ter alternativa usável em telas pequenas (scroll, stack, drawer, etc.).

## Temas

O usuário pode escolher entre **3 opções de tema**:

1. **Branco (claro)** — tema claro fixo
2. **Preto (escuro)** — tema escuro fixo
3. **Padrão do dispositivo** — segue a preferência do sistema operacional (`prefers-color-scheme`)

### Regras obrigatórias

- Toda **nova tela**, componente ou estilo deve respeitar os temas claros e escuros.
- Não usar cores fixas que quebrem o contraste ou fiquem ilegíveis em um dos temas.
- Preferir tokens/variáveis de tema (CSS variables, classes do design system) em vez de cores hardcoded.
- Ao criar UI, validar visualmente (ou mentalmente) nos modos claro, escuro e “seguir o dispositivo”.
