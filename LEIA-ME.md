# Buffet Circus — site

HTML, CSS e JavaScript puros, sem bibliotecas. Abra o `index.html` por um servidor (Live Server, Netlify, Vercel, hospedagem comum).

## Arquivos

- `index.html`: conteúdo e estrutura
- `styles.css`: identidade visual (preto, dourado e branco da logo), animações e responsivo
- `app.js`: scroll do hero, scroll horizontal das atrações, agenda, ingresso → WhatsApp
- `config.js`: dados que mudam com frequência (WhatsApp, horários, datas reservadas, integrações)
- `assets/img`: fotos otimizadas (webp), logo sem fundo, favicons e imagem de compartilhamento
- `assets/fonts`: Big Shoulders e Poppins hospedadas no próprio site (licença OFL incluída)

## O que preencher em `config.js`

- `instagram` e `endereco`: ficam escondidos no site enquanto estiverem vazios.
- `sessoes`: nomes e horários das festas (hoje: Matinê 12h às 16h e Noite 18h às 22h).

## Agenda

A ocupação está **simulada** (`agenda.simular: true`) para apresentação: sábados e datas próximas aparecem mais cheios. O resultado é sempre o mesmo para cada dia.

Para usar datas reais, escolha um caminho:

1. **Manual:** liste as reservas em `agenda.reservadas`, por exemplo `"2026-12-12": ["matine"]` ou `"2026-12-19": "todas"`, e troque `simular` para `false`.
2. **Automático:** informe em `agenda.fonte` uma URL que responda `?mes=2026-12` com o JSON das sessões já reservadas:

```json
{ "2026-12-12": ["noite"], "2026-12-19": ["matine", "noite"] }
```

Um Google Apps Script lendo o Google Agenda do buffet resolve isso.

## Leads

Cada envio gera um código de ingresso (ex.: `CIR-1511-4QW`) e abre o WhatsApp com a mensagem pronta: responsável, aniversariante e idade, data, horário, convidados, tema e como conheceu.

- `webhookLeads`: se preenchido, cada lead também é enviado em JSON (POST, `text/plain`), com UTMs da URL, para planilha, CRM, Make, Zapier ou n8n.
- `dataLayer`: o evento `lead_whatsapp` é disparado para Google Tag Manager, GA4 ou Meta Pixel (sem dados pessoais).

## Depois de publicar

Troque `og:image` no `<head>` pelo endereço completo da imagem (ex.: `https://seudominio.com.br/assets/img/og-circus.jpg`).
