/*
  Buffet Circus — configurações do site
  Edite aqui os dados da empresa e da agenda. O app.js lê tudo deste arquivo.
*/
window.CIRCUS_CONFIG = Object.freeze({
  // WhatsApp com DDI + DDD, só números
  whatsapp: "5515998012684",
  telefoneExibicao: "(15) 99801-2684",

  // Deixe vazio ("") para esconder do site
  instagram: "", // ex.: "https://www.instagram.com/buffetcircus"
  endereco: "", // ex.: "Rua Exemplo, 123, Centro, Sorocaba/SP"

  // Horários de festa que aparecem na agenda
  sessoes: [
    { id: "matine", nome: "Matinê", horario: "12h às 16h" },
    { id: "noite", nome: "Noite", horario: "18h às 22h" }
  ],

  agenda: {
    // Quantos meses à frente o cliente pode navegar
    mesesAFrente: 12,

    // true = gera uma ocupação simulada (para apresentar o site).
    // false = usa apenas "reservadas" e a "fonte" abaixo.
    simular: true,

    // Datas já reservadas, sempre têm prioridade sobre a simulação.
    // Use os ids das sessões (["matine"], ["noite"]) ou "todas".
    reservadas: {
      // "2026-12-12": ["matine"],
      // "2026-12-19": "todas"
    },

    // Opcional: URL que devolve as reservas de um mês em JSON, no formato
    // { "2026-12-12": ["noite"], "2026-12-19": ["matine", "noite"] }.
    // O site chama: fonte + "?mes=2026-12". Ex.: Google Apps Script lendo o Google Agenda.
    fonte: ""
  },

  // Opcional: URL que recebe cada lead em JSON (POST, text/plain) antes de abrir o WhatsApp.
  // Ex.: Google Apps Script salvando numa planilha, Make, Zapier ou n8n.
  webhookLeads: ""
});
