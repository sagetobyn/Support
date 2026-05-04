import type { Role } from "@/types/domain";

export function maskPhone(phone?: string, role: Role = "ops") {
  if (!phone) return "missing";
  const digits = phone.replace(/\D/g, "");
  if (role === "admin") return digits;
  if (digits.length < 4) return "xxxx";
  const first = digits.slice(0, 2);
  const last = digits.slice(-2);
  return `${first}xxxxxx${last}`;
}

export function phoneHash(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  let hash = 5381;
  for (const digit of digits) {
    hash = (hash * 33) ^ digit.charCodeAt(0);
  }
  return `local_${(hash >>> 0).toString(16)}`;
}
