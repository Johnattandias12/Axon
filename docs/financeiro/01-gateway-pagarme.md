# 01 — Gateway de Pagamento: Pagar.me

## Proposta Aceita: D15

**Consultor:** Felipe Olimpio Machado Silva (felipe.olimpio@pagar.me)  
**Proposta:** Francisco Johnattan Dias da Silva Costa — D15  
**Data aceite:** 18/05/2026  
**Validade original:** 25/05/2026

---

## Taxas Contratadas

| Método | MDR / Taxa | CET (custo efetivo) | Prazo de recebimento |
|--------|-----------|---------------------|----------------------|
| **Pix** | 1,09% | 1,09% | Imediato (conta Pagar.me) |
| **Cartão 1x** | 3,19% | ~4,59% | D+15 |
| **Cartão 2-3x** | 4,49% | ~7-9% | D+15 |
| **Cartão 6x** | 4,49% | ~12,93% | D+15 |
| **Cartão 12x** | 4,99% | ~21,62% | D+15 |
| **Boleto** | R$ 3,19/pago | — | D+2 |

**Custo fixo por transação:** R$ 0,99  
**Taxa de saque:** R$ 3,67 (grátis para conta Stone)  
**Mensalidade:** R$ 0,00  
**Antecipação:** automática embutida no modelo D+15

---

## Modelo D+15 Explicado

O modelo D+15 antecipa automaticamente todas as parcelas do cartão:
- Comprador parcelou em 6x → AXON recebe tudo em 15 dias
- O custo da antecipação já está embutido no CET
- Não há necessidade de solicitar antecipação manual

---

## Configuração Técnica

```env
# .env.local
PAGARME_API_KEY=sk_live_xxxxxxxxxxxx
PAGARME_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
PAGARME_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
PAGARME_RECIPIENT_ID=re_xxxxxxxxxxxx  # ID da AXON como recipient principal
```

## Endpoints utilizados

| Funcionalidade | Endpoint |
|---------------|----------|
| Criar order (Pix) | `POST /orders` |
| Criar order (Cartão) | `POST /orders` |
| Consultar pagamento | `GET /orders/:id` |
| Webhook confirmação | `POST /api/webhooks/pagarme` |
| Criar recipient | `POST /recipients` |
| Split rules | Via `split` no body do order |

## Ambiente Sandbox

- Dashboard: https://dashboard.pagar.me
- Alternar para "Teste" no menu superior
- Usar cartões de teste da documentação: https://docs.pagar.me/docs/realizando-uma-venda
