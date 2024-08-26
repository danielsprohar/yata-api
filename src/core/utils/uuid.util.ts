import { v4 as uuidv4 } from 'uuid';

export function generateId(): Buffer {
  return Buffer.from(uuidv4());
}
