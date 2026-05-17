# Pitch · AXON para Setor Público

> Documento de apresentação institucional da plataforma **AXON** para prefeituras, secretarias de cultura, esporte, turismo, e órgãos municipais que organizem eventos abertos ao público.
>
> Versão 1.0 · maio de 2026 · Currais Novos / Natal — RN
>
> Para converter em DOCX: `pandoc 10-pitch-setor-publico.md -o pitch-axon.docx --reference-doc=template-axon.docx`

---

## Resumo executivo

A AXON é um marketplace brasileiro de ingressos com infraestrutura **100% nacional**, criada para resolver três problemas crônicos que prefeituras enfrentam ao organizar eventos públicos:

1. **Falta de controle sobre o público real.** Em eventos gratuitos abertos, sem cadastro digital, não se sabe quem entrou, quantos eram, ou de onde vieram.
2. **Risco de fraude na entrada.** Pulseiras, listas em papel e cordões são fáceis de duplicar e geram filas, conflitos e exposição jurídica.
3. **Ausência de dados para prestação de contas.** Sem números auditáveis, fica difícil justificar verba, atrair patrocínio futuro ou comprovar alcance.

A AXON entrega:

- **Cadastro digital obrigatório** (mesmo em evento gratuito) com QR único, assinado por HMAC-SHA256 — impossível de falsificar.
- **App de validação na porta** (PWA, roda offline) que reconhece o ingresso e marca presença em tempo real.
- **Painel ao vivo** com check-ins por hora, gênero, faixa etária, origem, lote — exportável em CSV para anexar ao relatório de prestação.
- **Cumprimento integral** da Lei 12.933/2013 (meia-entrada) e LGPD (Lei 13.709/2018).
- **Modelo de cobrança flexível** para o setor público (vide seção 6).

---

## 1. Quem somos

A AXON é um produto da **Beyonder**, estúdio de software baseado no Rio Grande do Norte, com foco em produtos digitais para o mercado brasileiro de eventos. A operação é nacional, mas o time é regional — o que significa atendimento em português, fuso de Brasília e compreensão dos desafios de cidades do interior e do agreste.

**Owner técnico:** Johnattan Dias (diretor criativo).
**Sede operacional:** Currais Novos / Natal — RN.
**Stack:** Next.js, Supabase, Pagar.me, Resend — todos com data center em São Paulo.

---

## 2. Problema atual no setor público

| Cenário                                  | Impacto                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Evento gratuito sem cadastro             | Não há comprovação de público para futuras chamadas de patrocínio            |
| Pulseiras de tecido / cordão             | Custo unitário R$ 0,40–R$ 1,50 + descarte ambiental + facilmente duplicáveis |
| Lista de presença em papel               | Sujeita a fraude, perdas, e impossível agregar para relatório                |
| Controle por contadora manual na porta   | Margem de erro alta, sem rastreamento por horário                            |
| Eventos pagos sem nota fiscal eletrônica | Risco fiscal e impossibilidade de pleitear ISS reduzido                      |

---

## 3. O que a AXON resolve

### 3.1 Cadastro digital obrigatório

Mesmo em evento gratuito (festa junina, evento religioso institucional, jogo do time municipal), o cidadão se cadastra com **nome, CPF e email** para retirar a entrada. O ingresso vira um link com QR Code enviado por e-mail ou aberto direto no celular.

### 3.2 Validação na porta com PWA

Os fiscais usam um app web (PWA) que roda **offline** caso a internet do local falhe. A câmera lê o QR, verifica a assinatura HMAC-SHA256, e marca a presença. Funciona em qualquer celular Android ou iOS recente.

### 3.3 Painel ao vivo

Durante o evento, o gestor público acompanha em tempo real:

- Total de check-ins até o momento.
- Curva de chegada por hora (útil para escalar segurança / brigada).
- Distribuição por bairro, gênero e faixa etária (dados cadastrais agregados).
- Comparativo de público estimado vs. realizado.

### 3.4 Relatório de prestação de contas

Ao final do evento, a prefeitura exporta um **CSV completo** com todas as métricas para anexar ao processo administrativo, prestação de contas no TCE, ou relatório de patrocínio.

### 3.5 Conformidade legal automática

- **Meia-entrada 40%** garantida em banco (constraint + trigger).
- **LGPD** — Política de Privacidade clara, direito de exclusão, criptografia em trânsito e em repouso.
- **Auditoria** — todos os acessos a CPF ficam logados.

---

## 4. Casos de uso por secretaria

### 4.1 Secretaria de Cultura

- Festivais de música e teatro com retirada de ingresso gratuito controlada.
- Eventos com lotação máxima do auditório (controle preciso).
- Patrocínio comprovável: "tivemos 4.823 pessoas únicas, com 38% vindo de fora do município".

### 4.2 Secretaria de Esporte

- Jogos do time municipal com torcida cadastrada (reduz briga, identifica torcedor problemático).
- Corridas de rua com kit de chip integrado ao ingresso AXON.
- Aula de futsal com lista de chamada digital por aluno.

### 4.3 Secretaria de Turismo

- Roteiros guiados com cota limitada (Cariri, Sertão, Litoral).
- Réveillon municipal com áreas VIP separadas (palco, camarote, pista).
- Festas de padroeiro com controle por setor da arquibancada.

### 4.4 Secretaria de Educação

- Formaturas com convites nominais e validação na entrada.
- Cerimônias institucionais com lista de autoridades digital.
- Eventos pedagógicos com chamada automática por QR.

### 4.5 Câmara de Vereadores

- Sessões solenes com galera convidada e check-in nominal.
- Audiências públicas com registro auditável de quem participou.

---

## 5. Estudo de caso (simulado)

> **Festa Junina Municipal de Currais Novos / RN — Junho de 2026**
>
> 4 noites · público estimado 12.000 / noite · entrada gratuita com cadastro · 6 portões com PWA de validação.
>
> Resultados:
>
> - 38.412 check-ins únicos no total.
> - 71% público local, 22% região, 7% turistas (RJ, SP, BA, PB).
> - Pico de entrada às 21h (3.847 pessoas/hora) — base para próxima edição escalar brigada.
> - Idade média 28 anos — usado pela Sec. de Turismo para campanha pós-evento.
> - Custo: **R$ 0,00 por ingresso** — modelo "Vitrine institucional" (vide 6.1).

---

## 6. Modelos de cobrança para o poder público

### 6.1 Modelo "Vitrine Institucional" — R$ 0,00 por ingresso

Para eventos **gratuitos** organizados pela prefeitura sem patrocínio privado. A AXON cobra zero por ingresso. Em contrapartida, o evento exibe a marca AXON discretamente no portal e nos materiais (rodapé do site, footer do ingresso impresso).

> **Quando faz sentido:** prefeituras de pequeno porte iniciando experimentação digital. Atrai aprendizado mútuo.

### 6.2 Modelo "SaaS Mensal" — R$ 1.490/mês

Assinatura mensal com **eventos ilimitados** e **público ilimitado** durante o período. Inclui:

- Suporte por WhatsApp em horário comercial.
- Treinamento inicial da equipe (2h online).
- 1 visita técnica presencial por ano (para municípios em até 200 km de Natal).
- Atualizações de plataforma incluídas.

> **Quando faz sentido:** prefeituras com calendário cheio (>4 eventos/mês). Previsibilidade orçamentária.

### 6.3 Modelo "Taxa Reduzida" — 5% sobre ingresso pago

Quando o evento é **pago** mas o poder público é o organizador (ex.: arrecadação revertida ao fundo municipal). Taxa fixa de **5%** sobre o subtotal (vs. 10% do modelo comercial padrão).

> **Quando faz sentido:** shows com cobrança simbólica, espetáculos do Teatro Municipal, eventos com reversão para fundos sociais.

### 6.4 Modelo "Por Evento" — R$ 980/evento

Pagamento único por evento, válido por 30 dias antes + 7 dias depois. Inclui PWA de validação, painel ao vivo, exportação CSV e suporte premium.

> **Quando faz sentido:** evento pontual de grande porte (festa de padroeiro, festival anual). Sem compromisso de continuidade.

---

## 7. Aspectos legais para licitação

A AXON está estruturada para participar de processos de:

- **Dispensa de licitação** (Art. 24 da Lei 8.666/93) para valores abaixo do limite.
- **Pregão eletrônico** com proposta técnica e de preço.
- **Inexigibilidade** quando justificada a unicidade do fornecedor regional.
- **Termo de fomento / colaboração** com OSCIPs em projetos culturais.

Documentação disponível mediante solicitação:

- Contrato social da Beyonder.
- CND federal, estadual e municipal.
- Certidão de regularidade FGTS.
- Comprovação de regularidade fiscal e trabalhista.
- Atestados de capacidade técnica.

---

## 8. Migração e adoção

### Fase 1 — Piloto (15 dias)

- Setup do município no painel.
- Treinamento da equipe (2h online + material em vídeo).
- 1 evento piloto pequeno (até 500 pessoas) para validar fluxo.

### Fase 2 — Operação (30 dias)

- 2–3 eventos completos em produção.
- Acompanhamento próximo do time AXON.
- Ajustes finos de fluxo e perfis de acesso.

### Fase 3 — Autonomia (a partir do 2º mês)

- Município opera de forma independente.
- Suporte por canais padrão.
- Reuniões mensais de revisão (opcional).

---

## 9. Diferenciais vs. concorrência

| Critério                          | AXON                      | Concorrente nacional grande | Concorrente internacional |
| --------------------------------- | ------------------------- | --------------------------- | ------------------------- |
| Atendimento em português          | Sim, time RN              | Sim                         | Não (chatbot inglês)      |
| Conformidade LGPD nativa          | Sim, do design            | Adaptado                    | Adaptado pós-multa        |
| Meia-entrada 40% no banco         | Sim, constraint           | Verificação manual          | Não tem o conceito        |
| PWA offline na porta              | Sim                       | Não                         | Sim                       |
| Taxa setor público                | A partir de 0%            | 8–12%                       | 5% + USD setup            |
| Tempo de resposta a issue crítica | < 2h em horário comercial | 24–48h                      | SLA enterprise pago       |
| Hosting nacional (LGPD-friendly)  | São Paulo                 | São Paulo                   | EUA / Europa              |

---

## 10. Próximos passos

Para iniciar a conversa formal:

1. **Reunião de descoberta** (30 min online) — apresentamos o produto e entendemos o calendário de eventos da secretaria.
2. **Proposta técnico-comercial** customizada em até 5 dias úteis.
3. **Piloto sem custo** para o primeiro evento com até 500 pessoas, para que a equipe veja o produto rodando em ambiente real.

---

## Contato

**Beyonder · AXON**
Currais Novos / Natal — RN
[contato@axon.com.br](mailto:contato@axon.com.br) · WhatsApp comercial: (84) 9 9670-3029
axonia.vercel.app

---

> _Este documento está sob licença Creative Commons CC-BY 4.0. Pode ser adaptado e redistribuído pelas prefeituras parceiras com atribuição._
