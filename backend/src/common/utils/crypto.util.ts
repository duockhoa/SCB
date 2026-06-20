import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encryptString(text: string): string {
  const secretKey = process.env.EMAIL_CONFIG_SECRET_KEY;
  if (!secretKey) {
    throw new Error('EMAIL_CONFIG_SECRET_KEY is not defined in environment variables');
  }

  // Ensure key is 32 bytes (256 bits)
  const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substring(0, 32);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptString(text: string): string {
  const secretKey = process.env.EMAIL_CONFIG_SECRET_KEY;
  if (!secretKey) {
    throw new Error('EMAIL_CONFIG_SECRET_KEY is not defined in environment variables');
  }

  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) throw new Error('Invalid encrypted text format');
  
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substring(0, 32);

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
