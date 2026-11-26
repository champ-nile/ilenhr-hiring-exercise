"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { leaveTypes, type Draft, type DraftInput, type Workspace as WorkspaceData } from "@/lib/types";

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, { method, cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}
const blank: DraftInput = { leaveType: "Annual leave", startDate: null, endDate: null, note: "" };
const initials = (name: string) => name.split(" ").map(part => part[0]).slice(0, 2).join("");
const dates = (draft: Draft) => draft.startDate && draft.endDate ? `${draft.startDate} → ${draft.endDate}` : "Dates to confirm";

export default function Workspace() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [tab, setTab] = useState<"requests" | "people">("requests");
  const [editing, setEditing] = useState<Draft | null | undefined>(undefined);
  const [input, setInput] = useState<DraftInput>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reload = useCallback(async () => { const next = await api<WorkspaceData>("/api/workspace"); setData(next); return next; }, []);
  useEffect(() => { reload().catch(e => setError(e.message)); }, [reload]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => { if (editing !== undefined) cancelRef.current?.focus(); }, [editing]);
  function canLeave() { return !dirty || window.confirm("Discard your unsaved changes?"); }
  function open(draft: Draft | null) {
    if (!canLeave()) return;
    setEditing(draft); setInput(draft ? { leaveType: draft.leaveType, startDate: draft.startDate, endDate: draft.endDate, note: draft.note } : { ...blank });
    setDirty(false); setError(""); setNotice("");
  }
  function close() { if (canLeave()) { setEditing(undefined); setDirty(false); } }
  async function switchActor(id: string) {
    if (!canLeave()) return;
    setBusy(true); setError(""); setNotice("");
    try { await api("/api/demo-actor", "POST", { employeeId: id }); await reload(); setEditing(undefined); setDirty(false); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await api(editing ? `/api/drafts/${editing.id}` : "/api/drafts", editing ? "PATCH" : "POST", input);
      setDirty(false); setEditing(undefined); setNotice("Draft saved. You can come back to it anytime."); await reload();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  function field<K extends keyof DraftInput>(name: K, value: DraftInput[K]) { setInput(current => ({ ...current, [name]: value })); setDirty(true); }
  const actor = data?.actor;
  const manager = data?.employees.find(e => e.id === actor?.managerId);
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="ilenHR home"><span className="brand-icon">i</span>ilen<span>HR</span></a>
      <div className="workspace-label">DEMO WORKSPACE</div>
      <div className="company"><span className="company-icon">S</span><div>Studio North<small>Fictional company</small></div></div>
      <nav aria-label="Workspace navigation">
        <button className={tab === "requests" ? "nav-item selected" : "nav-item"} onClick={() => setTab("requests")}><span aria-hidden>▤</span>My leave requests</button>
        <button className={tab === "people" ? "nav-item selected" : "nav-item"} onClick={() => setTab("people")}><span aria-hidden>♧</span>People</button>
        <div className="nav-item unavailable"><span aria-hidden>▱</span>Approvals<span className="tiny-tag">To build</span></div>
      </nav>
      <a className="brief-link" href="/exercise">Read the exercise brief <span aria-hidden>↗</span></a>
      <div className="sidebar-bottom"><span className="green-dot"/>Local demo · SQLite<small>Fictional data. No real authentication.</small></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><span>Workspace <span className="slash">/</span> {tab === "people" ? "People" : "Time off"}</span><span className="demo-pill">Candidate starter</span></header>
      <div className="page-content">
        <section className="identity-bar" aria-label="Demo identity">
          <div><strong>Explore as a teammate</strong><p>Switch identities to explore the seeded team.</p></div>
          <label className="identity-select">Demo employee<select value={actor?.id || "aydan"} disabled={!data || busy} onChange={e => switchActor(e.target.value)}>{data?.employees.map(e => <option key={e.id} value={e.id}>{e.name} · {e.title}</option>)}</select></label>
        </section>
        {error && <div className="alert error" role="alert">{error}{!data && <button onClick={() => reload().then(() => setError("")).catch(e => setError(e.message))}>Retry</button>}</div>}
        {notice && <div className="alert success" role="status">{notice}</div>}
        {!data ? <p role="status">Loading your workspace…</p> : tab === "people" ? <>
          <div className="page-heading"><div><div className="eyebrow">THE PEOPLE BEHIND THE WORK</div><h1>Your team</h1><p>Five teammates. Two departments. One place to stay connected.</p></div></div>
          <section className="card directory" aria-label="Employee directory">{data.employees.map(e => <article className="person" key={e.id}><span className="avatar">{initials(e.name)}</span><div><h2>{e.name}</h2><p>{e.title}</p><small>{e.email}</small></div><div className="person-meta"><span>{e.department}</span><small>Manager: {data.employees.find(m => m.id === e.managerId)?.name || "No assigned manager"}</small></div></article>)}</section>
        </> : <>
          <div className="page-heading"><div><div className="eyebrow">MAKE SPACE FOR LIFE</div><h1>Your time, thoughtfully planned.</h1><p>Start a leave request and keep your plans in one place.</p></div><button className="primary" disabled={busy} onClick={() => open(null)}><span aria-hidden>＋</span> New draft</button></div>
          <section className="summary-grid" aria-label="Leave overview"><div className="stat"><span>Saved drafts</span><strong>{data.drafts.length.toString().padStart(2, "0")}</strong><small>Ready when you are</small></div><div className="stat"><span>Your department</span><strong className="text-stat">{actor?.department}</strong><small>{actor?.title}</small></div><div className="stat"><span>Your manager</span><strong className="text-stat">{manager?.name || "No assigned manager"}</strong><small>{manager ? "Assigned leave reviewer" : "Choose a teammate to explore their manager"}</small></div></section>
          <div className="section-title"><h2>My requests <span>{data.drafts.length}</span></h2><span className="muted">Drafts are visible only to their owner</span></div>
          <section className="card requests" aria-label="My drafts">
            {data.drafts.length === 0 ? <div className="empty"><span aria-hidden>☀</span><h3>A little time starts here.</h3><p>Create your first draft. You can add dates later.</p><button className="secondary" disabled={busy} onClick={() => open(null)}>Create a draft</button></div> : <div className="table-wrap"><table><thead><tr><th>Leave request</th><th>Dates</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{data.drafts.map(draft => <tr key={draft.id}><td><strong>{draft.leaveType}</strong><small className="note-preview">{draft.note || "No note added"}</small></td><td>{dates(draft)}</td><td><span className="status">Draft</span></td><td><button className="text-button" disabled={busy} onClick={() => open(draft)} aria-label={`Edit ${draft.leaveType} draft`}>Edit <span aria-hidden>↗</span></button></td></tr>)}</tbody></table></div>}
          </section>
          <section className="build-note"><span className="build-icon" aria-hidden>✦</span><div><h3>The next chapter is yours to build.</h3><p>Drafts work today. Submission, approvals, withdrawal, and activity history are the exercise.</p><a href="/exercise">See the requirements →</a></div></section>
        </>}
      </div>
    </main>
    {editing !== undefined && <div className="drawer-backdrop"><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="draft-title" onKeyDown={event => {
      if (event.key === "Escape" && !busy) close();
      if (event.key === "Tab") {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, a[href]'));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}><header><div><div className="eyebrow">TIME OFF</div><h2 id="draft-title">{editing ? "Edit your draft" : "Plan some time away"}</h2></div><button ref={cancelRef} className="icon-button" aria-label="Close draft editor" disabled={busy} onClick={close}>×</button></header>
      <p className="drawer-description">Save your plans now. Dates can stay blank until you know.</p>
      <div className="employee-chip"><span className="avatar small">{initials(actor?.name || "")}</span><div><strong>{actor?.name}</strong><small>{actor?.title}</small></div><span className="status">Draft</span></div>
      <form onSubmit={save}>
        <label>Leave type<select value={input.leaveType} disabled={busy} onChange={e => field("leaveType", e.target.value as DraftInput["leaveType"])}>{leaveTypes.map(t => <option key={t}>{t}</option>)}</select></label>
        <div className="date-fields"><label>Start date <small>Optional for drafts</small><input type="date" value={input.startDate || ""} disabled={busy} onChange={e => field("startDate", e.target.value || null)} /></label><label>End date <small>Optional for drafts</small><input type="date" value={input.endDate || ""} disabled={busy} onChange={e => field("endDate", e.target.value || null)} /></label></div>
        <label>Note <small>Optional</small><textarea value={input.note} maxLength={2000} rows={5} disabled={busy} placeholder="Anything you’d like to add?" onChange={e => field("note", e.target.value)} /></label><div className="character-count">{input.note.length}/2,000</div>
        <p className="form-hint">This saves a draft only. Submission and manager review are not implemented yet.</p>
        {error && <div className="alert error" role="alert">{error}</div>}
        <footer><button type="button" className="secondary" disabled={busy} onClick={close}>Cancel</button><button className="primary" disabled={busy} type="submit">{busy ? "Saving…" : "Save draft"}</button></footer>
      </form>
    </section></div>}
  </div>;
}
