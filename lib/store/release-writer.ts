import { timingSafeEqual } from "node:crypto";

export type ReleaseWriter = {
  id: string;
  email: string;
};

function bearerToken(authorization: string | null) {
  const match = /^Bearer\s+(.+)$/i.exec(authorization?.trim() ?? "");
  return match?.[1]?.trim() ?? "";
}

export function authenticateReleaseWriter(
  authorization: string | null,
  configuredToken = process.env.OAKTECH_RELEASE_WRITE_TOKEN,
): ReleaseWriter | null {
  const supplied = bearerToken(authorization);
  const expected = configuredToken?.trim() ?? "";
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (expectedBytes.length < 32 || suppliedBytes.length !== expectedBytes.length) return null;
  if (!timingSafeEqual(suppliedBytes, expectedBytes)) return null;
  return { id: "release-workflow", email: "release-workflow@oaktechz.internal" };
}
