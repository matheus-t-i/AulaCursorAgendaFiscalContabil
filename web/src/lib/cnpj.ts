/**
 * CNPJ numérico e alfanumérico (IN RFB 2.229/2024).
 * Máscara: XX.XXX.XXX/XXXX-DV
 * Posições 1–12: A–Z / 0–9 | Posições 13–14 (DV): somente dígitos
 */

const CNPJ_BASE_REGEX = /^[A-Z0-9]{12}\d{2}$/;

export function onlyCnpjChars(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Valor ASCII − 48, conforme manual da Receita Federal / Serpro */
function valorDv(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calcularDigito(base: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += valorDv(base[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function isCnpjValido(value: string): boolean {
  const limpo = onlyCnpjChars(value);
  if (limpo.length !== 14) return false;
  if (!CNPJ_BASE_REGEX.test(limpo)) return false;

  // Rejeita sequência repetida (ex.: 00000000000000) só no caso 100% numérico
  if (/^\d{14}$/.test(limpo) && /^(\d)\1{13}$/.test(limpo)) return false;

  const corpo = limpo.slice(0, 12);
  const dv1 = calcularDigito(corpo);
  const dv2 = calcularDigito(corpo + String(dv1));
  return limpo.slice(12) === `${dv1}${dv2}`;
}

/**
 * Aplica máscara enquanto digita.
 * Letras só nas 12 primeiras posições; DV (últimos 2) só números.
 */
export function maskCnpj(value: string): string {
  let limpo = onlyCnpjChars(value).slice(0, 14);

  // DV (posições 13–14) só pode ser dígito
  if (limpo.length > 12) {
    const corpo = limpo.slice(0, 12);
    const dv = limpo.slice(12).replace(/\D/g, '');
    limpo = (corpo + dv).slice(0, 14);
  }

  const parts: string[] = [];
  if (limpo.length <= 2) return limpo;
  parts.push(limpo.slice(0, 2));
  if (limpo.length <= 5) return `${parts[0]}.${limpo.slice(2)}`;
  parts.push(limpo.slice(2, 5));
  if (limpo.length <= 8) return `${parts[0]}.${parts[1]}.${limpo.slice(5)}`;
  parts.push(limpo.slice(5, 8));
  if (limpo.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${limpo.slice(8)}`;
  parts.push(limpo.slice(8, 12));
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${limpo.slice(12)}`;
}

export function formatCnpj(value: string): string {
  return maskCnpj(value);
}

export function cnpjPlaceholder(value: string): string {
  const limpo = onlyCnpjChars(value);
  const temLetra = /[A-Z]/.test(limpo);
  return temLetra ? 'AA.AAA.AAA/AAAA-00' : '00.000.000/0000-00';
}

export function mensagemErroCnpj(value: string): string | null {
  const limpo = onlyCnpjChars(value);
  if (!limpo) return 'Informe o CNPJ';
  if (limpo.length < 14) return 'CNPJ incompleto (14 caracteres)';
  if (!/^[A-Z0-9]{12}\d{2}$/.test(limpo)) {
    return 'Os 2 últimos caracteres (DV) devem ser numéricos';
  }
  if (!isCnpjValido(limpo)) return 'CNPJ inválido (dígito verificador)';
  return null;
}
