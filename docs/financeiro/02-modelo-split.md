# 02 — Modelo de Split AXON ↔ Organizador

## Como Funciona

Cada venda é dividida automaticamente no momento do pagamento via split rules da Pagar.me.

```
COMPRADOR paga R$ 51,00 (ingresso R$50 + R$1 conveniência Pix)
        │
        ▼
    PAGAR.ME
    ├── Desconta taxa (1,09% + R$0,99) = ~R$ 1,54
    └── Repassa R$ 49,46
            │
            ├── AXON (recipient principal)
            │   └── 9% do ingresso = R$ 4,50  +  conveniência R$ 1,00
            │       TOTAL AXON: ~R$ 5,50
            │
            └── ORGANIZADOR (recipient secundário)
                └── 91% líquido = ~R$ 43,96
```

## Prazo de Repasse ao Organizador

| Método do comprador | AXON recebe | Política de repasse ao organizador |
|--------------------|-------------|-----------------------------------|
| **Pix** | ~2 minutos | D+1 a D+2 (configurável por evento) |
| **Cartão** | D+15 | D+17 (2 dias após AXON receber) |

## Configuração de Recipients

Cada organizador aprovado no KYC recebe um `recipient_id` na Pagar.me.

```typescript
// Criação do recipient ao aprovar KYC
POST /recipients
{
  "name": "João da Silva",
  "email": "joao@gmail.com",
  "document": "000.000.000-00",
  "type": "individual",
  "default_bank_account": {
    "holder_name": "João da Silva",
    "holder_type": "individual",
    "holder_document": "000.000.000-00",
    "bank": "341",
    "branch_number": "0001",
    "account_number": "00000000",
    "type": "checking"
  }
}
```

## Split Rules no Order

```typescript
// Ao criar um order com split
{
  "items": [...],
  "splits": [
    {
      "amount": 450,          // 9% do ingresso em centavos (AXON)
      "recipient_id": "re_axon_principal",
      "type": "flat",
      "options": { "liable": true, "charge_processing_fee": true }
    },
    {
      "amount": 4496,         // saldo do organizador
      "recipient_id": "re_organizador_xyz",
      "type": "flat",
      "options": { "liable": false, "charge_processing_fee": false }
    }
  ]
}
```

## Variáveis no Banco de Dados

```sql
-- organizers.pagarme_recipient_id = ID do recipient na Pagar.me
-- organizers.fee_pct = porcentagem retida pela AXON (padrão: 9.00)
-- events.payment_methods = configuração de meios por evento (jsonb)
```
