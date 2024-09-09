import { parse, stringify, v4 as uuidv4 } from "uuid";

export function generatePrimaryKey(): Buffer {
  return uuidToBuffer(uuidv4());
}

export function uuidToBuffer(uuid: string): Buffer {
  return Buffer.from(parse(uuid).buffer);
}

export function bufferToUuid(buffer: Buffer): string {
  return stringify(buffer);
}
