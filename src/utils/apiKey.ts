import crypto from 'crypto';

export const generateApiKey = (): string => {
  return `te_${crypto.randomBytes(24).toString('hex')}`;
}; 