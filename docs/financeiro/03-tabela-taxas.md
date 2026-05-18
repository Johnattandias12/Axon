# 03 — Tabela de Taxas AXON

> Taxas que aparecem no checkout para o comprador. Transparência total.

## Para o Comprador

| Método | Taxa de conveniência | Quem paga |
|--------|---------------------|-----------|
| **Pix** | R$ 1,00 fixo por pedido | Comprador |
| **Cartão 1x** | +5% sobre o ingresso | Comprador |
| **Cartão 2-3x** | +8% sobre o ingresso | Comprador |
| **Cartão 4-6x** | +12% sobre o ingresso | Comprador |
| **Cartão 7-12x** | +18% sobre o ingresso | Comprador |

## Para o Organizador (Comissão AXON)

| Plano | Comissão AXON | Descrição |
|-------|--------------|-----------|
| **Padrão** | 9% | Sobre o valor do ingresso |

> A comissão é descontada automaticamente no split. O organizador vê o valor líquido na dashboard.

## Simulação por Ingresso

### Ingresso de R$ 50,00 — via Pix

| Item | Valor |
|------|-------|
| Valor do ingresso | R$ 50,00 |
| + Conveniência Pix | + R$ 1,00 |
| **Comprador paga** | **R$ 51,00** |
| — Taxa Pagar.me (1,09% + R$0,99) | — R$ 1,55 |
| — Comissão AXON (9%) | — R$ 4,50 |
| **Organizador recebe** | **R$ 44,95** |
| **AXON retém (líquido)** | **~R$ 3,95** |

### Ingresso de R$ 50,00 — Cartão 1x

| Item | Valor |
|------|-------|
| Valor do ingresso | R$ 50,00 |
| + Conveniência cartão (5%) | + R$ 2,50 |
| **Comprador paga** | **R$ 52,50** |
| — Taxa Pagar.me (CET 4,59% + R$0,99) | — R$ 3,40 |
| — Comissão AXON (9%) | — R$ 4,50 |
| **Organizador recebe** | **R$ 44,60** |
| **AXON retém (líquido)** | **~R$ 3,60** |

## Comparativo com Concorrência

| Plataforma | Taxa ao produtor | Taxa ao comprador | Recebimento |
|------------|-----------------|-------------------|-------------|
| **Sympla** | 10% + R$3,99 mín | 2-2,5% | D+30 pós evento |
| **Ingresse** | 10-12% | 3-5% | D+30 pós evento |
| **Eventim** | Negociado | até 20% | D+30 a D+45 |
| **AXON** ⭐ | **9% sem mínimo** | **R$1 fixo (Pix)** | **D+1 a D+2** |

## Configuração no Código

```typescript
// src/lib/payments/fees.ts
export const AXON_COMMISSION_PCT = 0.09  // 9%

export const CONVENIENCE_FEES = {
  pix:           { type: 'fixed', value_cents: 100 },
  credit_1x:     { type: 'percent', value: 0.05 },
  credit_2_3x:   { type: 'percent', value: 0.08 },
  credit_4_6x:   { type: 'percent', value: 0.12 },
  credit_7_12x:  { type: 'percent', value: 0.18 },
}
```
