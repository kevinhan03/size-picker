export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

export function avatarMime(bytes: Uint8Array): string | null {
  if (!bytes.length || bytes.length > AVATAR_MAX_BYTES) return null;
  const data = Buffer.from(bytes);
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  )
    return "image/jpeg";
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

export function ownedAvatar(
  path: string | null,
  userId: string
): path is string {
  return Boolean(
    path?.startsWith(`avatars/${userId}/`) && !path.includes("..")
  );
}
