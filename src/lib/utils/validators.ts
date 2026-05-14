export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]!) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9]!)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]!) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(digits[10]!)
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const calcDigit = (d: string, weights: number[]): number => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(d[i]!) * weights[i]!
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  if (calcDigit(digits, w1) !== parseInt(digits[12]!)) return false
  if (calcDigit(digits, w2) !== parseInt(digits[13]!)) return false
  return true
}

export function formatCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "").slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "").slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}
