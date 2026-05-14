# 07 — Compliance Legal

> Esse arquivo só muda com aprovação do owner. Mudanças aqui implicam revisão jurídica.

## LGPD (Lei 13.709/2018)

### Dados pessoais tratados

| Dado                     | Base legal                                            | Finalidade                       |
| ------------------------ | ----------------------------------------------------- | -------------------------------- |
| Nome completo            | Execução de contrato                                  | Identificar titular do ingresso  |
| CPF                      | Obrigação legal (meia-entrada) + execução de contrato | Validação + identificação        |
| E-mail                   | Execução de contrato                                  | Envio do ingresso, comunicações  |
| Telefone                 | Execução de contrato                                  | Recuperação, comunicação urgente |
| Endereço IP, fingerprint | Legítimo interesse                                    | Antifraude                       |
| UTM, navegação           | Consentimento                                         | Analytics e marketing            |

### Direitos do titular (implementar até MVP)

Endpoints públicos em `/api/lgpd/`:

- `POST /api/lgpd/access-request` — solicita relatório de seus dados (envia por e-mail, ZIP).
- `POST /api/lgpd/delete-request` — solicita anonimização. Sistema:
  - Mantém `tickets` e `orders` (necessários para fiscal + contábil) com PII anonimizada.
  - Substitui `full_name` por "Titular anonimizado", `cpf` por hash, `email` por null.
  - Loga em `audit_logs`.
- `POST /api/lgpd/portability` — exporta JSON estruturado.
- `POST /api/lgpd/rectify` — corrige dado.

### Política de privacidade

- Página `/privacidade` obrigatória, linkada no rodapé.
- Aceite explícito **antes** do primeiro cadastro (checkbox unchecked por padrão).
- Cookies: banner com opt-in granular (essenciais, analytics, marketing).

### DPO

Nomeado: **Johnattan** (até crescer e contratar). Contato `dpo@axon.com.br`.

### Incidentes

Em caso de vazamento:

1. Conter (revogar tokens, rotacionar secrets).
2. Avaliar gravidade (LGPD art. 48).
3. Comunicar ANPD em até 2 dias úteis se houver risco relevante.
4. Comunicar titulares afetados.
5. Postmortem público.

---

## Meia-entrada (Lei 12.933/2013)

### Regra

**40% do total de ingressos disponíveis** para qualquer evento cultural/esportivo/desportivo são obrigatoriamente meia-entrada para:

- Estudantes (carteira CIE válida ou app)
- Idosos (60+)
- PCDs e 1 acompanhante
- Jovens de baixa renda (15–29 com CadÚnico)
- Doadores regulares de sangue (em alguns estados)
- Professores da rede pública (em SP e outros)

### Implementação no sistema

- Em `ticket_lots`: campo `is_half_price` boolean.
- **Validação de criação de evento:** soma de `quantity_total` dos lots `is_half_price=true` deve ser ≥ 40% do total. Implementar via trigger:

```sql
CREATE FUNCTION validate_half_price_quota() RETURNS trigger AS $$
BEGIN
  -- Calcula totais do evento ao publicar
  -- Raise exception se half_price < 40%
END;
$$;

CREATE TRIGGER ensure_half_price_quota
BEFORE UPDATE OF status ON events
WHEN (NEW.status = 'published')
EXECUTE FUNCTION validate_half_price_quota();
```

- Comprador escolhe "meia" no checkout → declara categoria → envia foto do documento (Storage + verificação manual posterior por amostragem).
- Na porta, validador confere documento físico se ticket for `is_half_price`.

### Preço

Meia = **50% do inteiro do mesmo lote**. Sistema calcula automaticamente.

---

## CDC — Código de Defesa do Consumidor

### Direito de arrependimento (art. 49)

7 dias após a compra online. **Mas:** jurisprudência considera que para ingresso com data marcada, o arrependimento perde efeito após a realização do evento.

**Política AXON (proposta padrão, organizador pode customizar):**

- Reembolso integral se solicitado em até 7 dias após a compra **E** ao menos 48h antes do evento.
- Após esse prazo, sem reembolso (exceto cancelamento do evento pelo organizador).
- Exibir essa política na página do evento + checkout + confirmação por e-mail.

### Cancelamento do evento pelo organizador

- Reembolso **integral obrigatório** em até 12 dias (CDC + jurisprudência).
- Sistema dispara reembolso automático em massa via Pagar.me.

---

## Estatuto do Torcedor (Lei 10.671/2003)

Para eventos esportivos:

- **Ingresso nominal obrigatório**: nome + CPF do titular.
- Sistema já força isso em `tickets.holder_name` e `holder_cpf`.
- Em eventos de futebol profissional: também data de nascimento + idade.
- Câmera de segurança? Não nos cabe (responsabilidade do estabelecimento).

---

## Estatuto do Idoso e da Pessoa com Deficiência

- Reserva mínima de 5% dos ingressos para idosos (Estatuto art. 23, regulamentado por estado).
- Acessibilidade da plataforma: WCAG 2.1 AA. Implementar nas páginas públicas (alt em imagens, contraste, navegação por teclado, ARIA labels).

---

## Tributação

**Atenção:** consultar contador. Linhas gerais:

- AXON é marketplace → emite NF de **serviço** sobre a comissão (não sobre o valor do ingresso).
- Organizador é responsável tributário pelo evento.
- Operação ISS no município da AXON (Natal/RN, alíquota ~5%).
- Sem incidência de ICMS (não há mercadoria).
- Receita Federal: ECD/ECF anuais. Domicílio: contador.

---

## Contrato de adesão do organizador

Antes de publicar primeiro evento, organizador aceita:

- Termos de serviço.
- Política de repasse (D+1 Pix, D+30 cartão, taxa X%).
- Responsabilidades (qualidade do evento, reembolso em caso de cancelamento, fiscal).
- Política de uso de marca.

Arquivo template em `legal/termos-organizador.md` (versionar).

Aproveitar padrão **Filgueira V9** do owner (Poppins, paleta preto/dourado, prosa fluida nas qualificações). Skill `skill-juridico-filgueira` disponível.

---

## Termos do comprador

Aceite no primeiro cadastro:

- Termos de uso.
- Política de privacidade (LGPD).
- Política de reembolso.

---

## Marca

- Nome "AXON" — checar INPI antes de campanhas grandes.
- Domínios sugeridos: `axon.com.br`, `axon.app`.
- Logo em desenvolvimento (Sprint 0).

---

## Auditoria

- `audit_logs` registra: acesso a CPF, mudanças em RLS, publicação de evento, saques, modificações em fraud_flags.
- Retenção: 5 anos (obrigação fiscal/LGPD).
