import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

export async function hashFile(filePath: string, algorithm = "sha512") {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}
