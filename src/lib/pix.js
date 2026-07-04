/* ============================================================
   Gerador de BR Code Pix (EMV® QRCPS-MPM)
   Gera o payload "copia e cola" válido para a chave da loja,
   com valor e identificador do pedido.
   ============================================================ */

function emv(id, value) {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(payload) {
  // CRC16-CCITT (0xFFFF), polinômio 0x1021 — exigido pelo BACEN
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitize(text, max) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .-]/g, '')
    .toUpperCase()
    .slice(0, max);
}

/**
 * Monta o payload Pix copia-e-cola.
 * @param {object} opts
 * @param {string} opts.chave    chave Pix (telefone no formato +55...)
 * @param {string} opts.nome     nome do recebedor (max 25)
 * @param {string} opts.cidade   cidade do recebedor (max 15)
 * @param {number} [opts.valor]  valor em reais
 * @param {string} [opts.txid]   identificador da transação (max 25)
 */
export function buildPixPayload({ chave, nome, cidade, valor, txid = '***' }) {
  const merchantAccount = emv('26', emv('00', 'br.gov.bcb.pix') + emv('01', chave));
  let payload =
    emv('00', '01') +
    merchantAccount +
    emv('52', '0000') +
    emv('53', '986');

  if (valor && valor > 0) payload += emv('54', valor.toFixed(2));

  payload +=
    emv('58', 'BR') +
    emv('59', sanitize(nome, 25)) +
    emv('60', sanitize(cidade, 15)) +
    emv('62', emv('05', sanitize(txid, 25) || '***'));

  payload += '6304';
  return payload + crc16(payload);
}
