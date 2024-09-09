import { v4 as uuidv4 } from "uuid";

export function generateId(): Buffer {
  return Buffer.from(uuidv4());
}

export function uuidToBuffer(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

export function bufferToUuid(buffer: Buffer): string {
  const hex = buffer.toString("hex");
  return `${hex.substring(0, 8)}-${hex.substring(8, 4)}-${hex.substring(
    12,
    4,
  )}-${hex.substring(16, 4)}-${hex.substring(20)}`;
}
