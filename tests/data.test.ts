import { beforeEach, describe, expect, it } from "vitest";
import { installLocalStorage, makeConfig } from "./helpers";
import { DocumentError, detectKind, extractDocumentText } from "@/lib/server/documents";

const store = installLocalStorage();
// Imported after localStorage exists.
const auth = await import("@/lib/auth");
const storage = await import("@/lib/storage");

describe("device accounts", () => {
  beforeEach(() => store.clear());

  it("never stores the password and can log back in", async () => {
    const res = await auth.signup({ name: "Asha", email: "Asha@Example.com", password: "correct horse" });
    expect(res.ok).toBe(true);
    const raw = store.get(storage.KEYS.users)!;
    expect(raw).not.toContain("correct horse");
    expect(raw).toContain("passwordHash");
    auth.logout();
    expect(auth.currentUser()).toBeNull();
    expect((await auth.login("asha@example.com", "correct horse")).ok).toBe(true);
    expect((await auth.login("asha@example.com", "wrong password")).ok).toBe(false);
  });

  it("refuses duplicate emails", async () => {
    await auth.signup({ name: "A", email: "a@b.co", password: "12345678" });
    const again = await auth.signup({ name: "B", email: "A@B.CO", password: "12345678" });
    expect(again.ok).toBe(false);
  });

  it("validates signup input", () => {
    expect(auth.validateSignup({ name: "A", email: "a@b.co", password: "12345678", confirm: "12345678" })).toMatch(/name/);
    expect(auth.validateSignup({ name: "Ann", email: "nope", password: "12345678", confirm: "12345678" })).toMatch(/email/);
    expect(auth.validateSignup({ name: "Ann", email: "a@b.co", password: "short", confirm: "short" })).toMatch(/8/);
    expect(auth.validateSignup({ name: "Ann", email: "a@b.co", password: "12345678", confirm: "different" })).toMatch(/match/);
    expect(auth.validateSignup({ name: "Ann", email: "a@b.co", password: "12345678", confirm: "12345678" })).toBeNull();
  });
});

describe("interview storage", () => {
  beforeEach(() => store.clear());

  const session = (id: string, userId: string, status: "in-progress" | "completed" = "completed") => ({
    id,
    userId,
    config: makeConfig({ resumeText: "my resume" }),
    createdAt: Date.now(),
    status,
    transcript: [],
  });

  it("keeps each user's interviews separate", () => {
    storage.saveSession(session("1", "alice"));
    storage.saveSession(session("2", "bob"));
    expect(storage.listSessions("alice").map((s) => s.id)).toEqual(["1"]);
    expect(storage.getSession("alice", "2")).toBeUndefined();
  });

  it("filters out records that don't belong to the user even if storage was tampered with", () => {
    store.set(storage.KEYS.sessions("alice"), JSON.stringify([session("x", "mallory")]));
    expect(storage.listSessions("alice")).toEqual([]);
  });

  it("keeps the resume during the call but drops it from finished sessions", () => {
    storage.saveSession(session("1", "a", "in-progress"));
    expect(storage.getSession("a", "1")!.config.resumeText).toBe("my resume");
    storage.saveSession({ ...session("1", "a"), status: "completed" });
    expect(storage.getSession("a", "1")!.config.resumeText).toBe("");
  });

  it("deletes one interview or all user data", () => {
    storage.saveSession(session("1", "a"));
    storage.saveSession(session("2", "a"));
    storage.deleteSession("a", "1");
    expect(storage.listSessions("a").map((s) => s.id)).toEqual(["2"]);
    storage.updateProfile("a", { resumeText: "r" });
    storage.deleteAllUserData("a");
    expect(storage.listSessions("a")).toEqual([]);
    expect(storage.getProfile("a")).toEqual({});
  });
});

describe("legacy migration", () => {
  it("hashes plaintext passwords from the original app and removes them", async () => {
    store.clear();
    store.set("intervu_users", JSON.stringify([{ id: "old1", name: "Old", email: "old@x.io", password: "hunter22", resumeFileName: "cv.pdf" }]));
    store.set("intervu_user", JSON.stringify({ id: "old1" }));
    store.set("intervu_resume_old1", "data:application/pdf;base64,AAAA");
    await auth.migrateLegacy();
    expect(store.has("intervu_users")).toBe(false);
    expect(store.has("intervu_resume_old1")).toBe(false);
    expect(store.get(storage.KEYS.users)).not.toContain("hunter22");
    expect(auth.currentUser()?.id).toBe("old1");
    expect(storage.getProfile("old1")).toMatchObject({ resumeFileName: "cv.pdf", resumeNeedsReupload: true });
    auth.logout();
    expect((await auth.login("old@x.io", "hunter22")).ok).toBe(true);
  });
});

describe("document parsing", () => {
  const enc = (s: string) => new TextEncoder().encode(s);

  it("identifies files by content, not just name", () => {
    expect(detectKind("cv.pdf", enc("%PDF-1.7"))).toBe("pdf");
    expect(detectKind("renamed.txt", enc("%PDF-1.4"))).toBe("pdf");
    expect(detectKind("cv.docx", new Uint8Array([0x50, 0x4b, 3, 4]))).toBe("docx");
    expect(() => detectKind("cv.doc", enc("xx"))).toThrow(/\.doc/);
    expect(() => detectKind("photo.png", enc("xx"))).toThrow(DocumentError);
  });

  it("extracts plain text and rejects near-empty documents", async () => {
    const text = "Experience: built a booking system for a clinic. ".repeat(5);
    const out = await extractDocumentText("cv.txt", enc(text).buffer as ArrayBuffer);
    expect(out.text).toContain("booking system");
    await expect(extractDocumentText("cv.txt", enc("hi").buffer as ArrayBuffer)).rejects.toThrow(/almost no text/);
  });

  it("explains unreadable PDFs instead of crashing", async () => {
    await expect(extractDocumentText("cv.pdf", enc("%PDF-1.4 garbage").buffer as ArrayBuffer)).rejects.toThrow(DocumentError);
  });

  it("enforces the size limit", async () => {
    await expect(extractDocumentText("big.txt", new ArrayBuffer(6 * 1024 * 1024))).rejects.toThrow(/5 MB/);
  });
});

describe("password reset", () => {
  beforeEach(() => store.clear());

  it("resets with matching email and name, keeps the account, and logs in", async () => {
    const created = await auth.signup({ name: "Prachi Yadav", email: "p@x.io", password: "oldpassword" });
    auth.logout();
    const wrong = await auth.resetPassword({ email: "p@x.io", name: "Someone Else", password: "newpassword", confirm: "newpassword" });
    expect(wrong.ok).toBe(false);
    const res = await auth.resetPassword({ email: "P@X.IO", name: "  prachi   yadav ", password: "newpassword", confirm: "newpassword" });
    expect(res.ok && res.user.id).toBe(created.ok && created.user.id);
    expect(auth.currentUser()?.email).toBe("p@x.io");
    auth.logout();
    expect((await auth.login("p@x.io", "oldpassword")).ok).toBe(false);
    expect((await auth.login("p@x.io", "newpassword")).ok).toBe(true);
  });

  it("validates the new password", async () => {
    await auth.signup({ name: "A B", email: "a@b.co", password: "12345678" });
    expect((await auth.resetPassword({ email: "a@b.co", name: "A B", password: "short", confirm: "short" })).ok).toBe(false);
    expect((await auth.resetPassword({ email: "a@b.co", name: "A B", password: "12345678x", confirm: "different" })).ok).toBe(false);
  });
});
