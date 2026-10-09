"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/Headers";
import { AvatarPicker } from "@/components/AvatarPicker";
import { DocumentInput } from "@/components/DocumentInput";
import { Button, Card, ConfirmDialog, Notice, PageTitle, TextField } from "@/components/ui";
import { deleteAccount, updateUser, type PublicUser } from "@/lib/auth";
import { listSessions, remove, KEYS, StorageFullError, updateProfile } from "@/lib/storage";
import { useProfile, useSessions } from "@/lib/hooks/useUserData";

export default function SettingsPage() {
  return (
    <AppShell>
      <RequireAuth>{(user) => <Settings user={user} />}</RequireAuth>
    </AppShell>
  );
}

function Settings({ user }: { user: PublicUser }) {
  const router = useRouter();
  const profile = useProfile(user.id);
  const sessions = useSessions(user.id);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [saved, setSaved] = useState<string>();
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState<"history" | "account" | null>(null);
  const [draftResume, setDraftResume] = useState<{ text: string; name?: string } | null>(null);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Enter a name of at least 2 characters.");
    try {
      updateUser(user.id, { name: name.trim(), avatar });
      setError(undefined);
      setSaved("Profile saved.");
    } catch (err) {
      setError(err instanceof StorageFullError ? err.message : "Couldn't save your profile.");
    }
  };

  const saveResume = () => {
    if (!draftResume?.text) return;
    try {
      updateProfile(user.id, { resumeText: draftResume.text, resumeFileName: draftResume.name ?? "Pasted resume", resumeNeedsReupload: false });
      setDraftResume(null);
      setSaved("Resume saved.");
    } catch (err) {
      setError(err instanceof StorageFullError ? err.message : "Couldn't save the resume.");
    }
  };

  const exportData = () => {
    const data = { exportedAt: new Date().toISOString(), profile: { name: user.name, email: user.email }, resume: profile.resumeText ?? null, interviews: listSessions(user.id) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `intervu-export-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle title="Settings" />
      <div className="grid max-w-3xl gap-6">
        {saved && (
          <Notice tone="success" role="status">
            {saved}
          </Notice>
        )}
        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}

        <Card>
          <h2 className="mb-4 text-xl font-bold">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Email" value={user.email} disabled hint="Email can't be changed for a device account." />
            <AvatarPicker value={avatar} onChange={setAvatar} />
            <Button type="submit">Save profile</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-1 text-xl font-bold">Saved resume</h2>
          <p className="mb-4 text-muted">Used to personalise interviews when you choose it. Only the text is kept, in this browser.</p>
          {profile.resumeText && !draftResume ? (
            <div className="space-y-3">
              <p>
                <strong>{profile.resumeFileName ?? "Saved resume"}</strong> · {profile.resumeText.length.toLocaleString()} characters
              </p>
              <details>
                <summary className="cursor-pointer font-bold text-indigo">Show the text we use</summary>
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-paper p-3 font-sans text-sm">{profile.resumeText}</pre>
              </details>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setDraftResume({ text: "" })}>
                  Replace
                </Button>
                <Button variant="danger" onClick={() => updateProfile(user.id, { resumeText: undefined, resumeFileName: undefined })}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.resumeNeedsReupload && (
                <Notice tone="warning">Your earlier resume file was stored in a way interviews couldn&apos;t use. Upload it again here.</Notice>
              )}
              <DocumentInput
                label="Resume"
                value={draftResume?.text ?? ""}
                fileName={draftResume?.name}
                maxChars={16000}
                onChange={(text, n) => setDraftResume({ text, name: n })}
                placeholder="Paste your resume text"
              />
              <div className="flex gap-2">
                <Button onClick={saveResume} disabled={!draftResume?.text}>
                  Save resume
                </Button>
                {profile.resumeText && (
                  <Button variant="ghost" onClick={() => setDraftResume(null)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 text-xl font-bold">Your data</h2>
          <p className="mb-4 text-muted">
            {sessions.length} interview{sessions.length === 1 ? "" : "s"} stored in this browser. Audio recordings are not kept by IntervU.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}>
              Download my data
            </Button>
            <Button variant="danger" onClick={() => setConfirm("history")} disabled={!sessions.length}>
              Delete all interviews
            </Button>
            <Button variant="danger" onClick={() => setConfirm("account")}>
              Delete account
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === "account" ? "Delete your account?" : "Delete all interviews?"}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm === "account") {
                  deleteAccount(user.id);
                  router.replace("/");
                } else {
                  remove(KEYS.sessions(user.id));
                  setSaved("All interviews deleted.");
                }
                setConfirm(null);
              }}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        {confirm === "account"
          ? "Your profile, saved resume, transcripts and reports will be removed from this browser. This can't be undone."
          : "All transcripts and reports will be removed from this browser. This can't be undone."}
      </ConfirmDialog>
    </>
  );
}
