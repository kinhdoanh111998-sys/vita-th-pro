// Affiliate ref tracker — first-touch attribution, 30 ngày trên localStorage.
// Dùng ở mọi trang public: đọc ?ref=..., lưu ngầm, không popup.

const STORAGE_KEY = "vitath_ref_v2";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type Stored = { code: string; savedAt: number; path?: string };

function safeLocal(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Trả về ref code còn hạn, hoặc null. */
export function getStoredRef(): string | null {
  const ls = safeLocal();
  if (!ls) return null;
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.code) return null;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      ls.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.code.trim().toUpperCase();
  } catch {
    return null;
  }
}

/** Ghi ref (first-touch: nếu đã có ref còn hạn thì KHÔNG đè). */
export function saveRef(code: string, path?: string): boolean {
  const ls = safeLocal();
  if (!ls) return false;
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return false;
  const existing = getStoredRef();
  if (existing) return false; // first-touch wins
  try {
    const payload: Stored = { code: clean, savedAt: Date.now(), path };
    ls.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** Xoá ref (gọi sau khi đã gán vào tài khoản thành công). */
export function clearRef(): void {
  const ls = safeLocal();
  if (!ls) return;
  try {
    ls.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Log click về server (best-effort, không chặn UI). */
export async function logRefClick(code: string, path: string) {
  try {
    await fetch("/api/public/ref/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_code: code, landing_path: path }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
