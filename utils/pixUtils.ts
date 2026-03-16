
function generateCrc16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export const generatePixPayload = (
  key: string,
  name: string,
  city: string,
  amount: number,
  txid: string = '***'
): string => {
  const cleanKey = key.replace(/\s/g, '');
  const cleanName = name.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Max 25 chars, no accents
  const cleanCity = city.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); // Max 15 chars
  const amountStr = amount.toFixed(2);

  // Payload Construction
  let payload = 
    formatField('00', '01') + // Payload Format Indicator
    formatField('26', // Merchant Account Information
      formatField('00', 'br.gov.bcb.pix') +
      formatField('01', cleanKey)
    ) +
    formatField('52', '0000') + // Merchant Category Code
    formatField('53', '986') + // Transaction Currency (BRL)
    formatField('54', amountStr) + // Transaction Amount
    formatField('58', 'BR') + // Country Code
    formatField('59', cleanName) + // Merchant Name
    formatField('60', cleanCity) + // Merchant City
    formatField('62', // Additional Data Field Template
      formatField('05', txid) // Reference Label (TxID)
    ) +
    '6304'; // CRC16 ID + Length

  // Calculate and Append CRC
  payload += generateCrc16(payload);

  return payload;
};
