"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBalance, addUser, changePin, toggleUserStatus, deleteUser } from "@/actions/users";
import { Search, RefreshCw, Plus, Settings, Trash2, Edit3, Eye, EyeOff, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type User = {
  id: number;
  balance: number;
  status: "active" | "blocked";
  createdAt: number;
  pinHash: string;
};

type Stats = {
  avgBalance: number;
  totalHeld: number;
  total: number;
  active: number;
  blocked: number;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function UsersDesk({ initialUsers, stats }: { initialUsers: User[]; stats: Stats }) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "high" | "low">("new");
  const [pageSize, setPageSize] = useState(20);
  
  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [pinUser, setPinUser] = useState<User | null>(null);
  
  // Inline Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBalance, setEditBalance] = useState<string>("");

  // PIN show state
  const [revealedPin, setRevealedPin] = useState<number | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({ id: "", balance: "0", pin: "" });
  const [newPin, setNewPin] = useState("");
  const [formErr, setFormErr] = useState("");

  const filtered = users.filter(u => {
    const matchesFilter = filter === "all" || u.status === filter;
    const matchesQuery = !query.trim() || String(u.id).includes(query);
    return matchesFilter && matchesQuery;
  }).sort((a, b) => {
    if (sort === "high") return b.balance - a.balance;
    if (sort === "low") return a.balance - b.balance;
    return b.createdAt - a.createdAt;
  });

  const visible = filtered.slice(0, pageSize);

  // Handlers
  const handleSaveBalance = async (id: number) => {
    const val = parseFloat(editBalance);
    if (isNaN(val)) { toast("Invalid balance"); return; }
    const u = users.find(x => x.id === id);
    if (!u) return;
    const diff = val - u.balance;
    
    // Optimistic
    setUsers(prev => prev.map(x => x.id === id ? { ...x, balance: val } : x));
    setEditingId(null);
    
    const res = await updateBalance({ userId: id, amount: diff });
    if (res.error) { toast(res.error); router.refresh(); }
    else { toast("Balance updated"); router.refresh(); }
  };

  const handleCreate = async () => {
    setFormErr("");
    const id = Number(newUser.id);
    const bal = parseFloat(newUser.balance);
    if (!id || id < 100000) { setFormErr("User ID must be 6 digits."); return; }
    if (users.find(u => u.id === id)) { setFormErr("User ID already exists."); return; }
    if (!/^\d{6}$/.test(newUser.pin)) { setFormErr("PIN must be 6 digits."); return; }
    
    const res = await addUser({ id, balance: bal, pin: newUser.pin });
    if (res.error) { setFormErr(res.error); return; }
    toast(`User ${id} created`);
    setAddOpen(false);
    setNewUser({ id: "", balance: "0", pin: "" });
    router.refresh();
  };

  const handleChangePin = async () => {
    setFormErr("");
    if (!/^\d{6}$/.test(newPin)) { setFormErr("PIN must be 6 digits."); return; }
    const res = await changePin({ userId: pinUser!.id, pin: newPin });
    if (res.error) { setFormErr(res.error); return; }
    toast("PIN updated");
    setPinUser(null);
    setNewPin("");
    router.refresh();
  };

  const handleToggleStatus = async () => {
    if (!manageUser) return;
    const newStatus = manageUser.status === "active" ? "blocked" : "active";
    const res = await toggleUserStatus({ userId: manageUser.id, status: newStatus });
    if (res.error) { toast(res.error); return; }
    toast(`User ${manageUser.id} ${newStatus}`);
    setManageUser(null);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    const prev = users;
    setUsers(p => p.filter(u => u.id !== id));
    toast(`User ${id} deleted`, () => setUsers(prev));
    await deleteUser(id);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6 grid gap-4 md:gap-6 content-start">
      
      {/* Pulse Card */}
      <header className="bg-[var(--navy)] text-white rounded-[var(--r)] p-5 flex justify-between items-center flex-wrap gap-4">
        <div>
          <small className="text-[#8da0c0]">Average balance</small>
          <div className="text-4xl font-extrabold">{inr0(stats.avgBalance)}</div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-[var(--navy-2)] rounded-[14px] p-3 min-w-[100px]"><small className="text-[#8da0c0]">Users</small><b className="block text-xl">{stats.total}</b></div>
          <div className="bg-[var(--navy-2)] rounded-[14px] p-3 min-w-[100px]"><small className="text-[#8da0c0]">Active</small><b className="block text-xl">{stats.active}</b></div>
          <div className="bg-[var(--navy-2)] rounded-[14px] p-3 min-w-[100px]"><small className="text-[#8da0c0]">Blocked</small><b className="block text-xl">{stats.blocked}</b></div>
          <div className="bg-[var(--navy-2)] rounded-[14px] p-3 min-w-[100px]"><small className="text-[#8da0c0]">Total held</small><b className="block text-xl">{inr0(stats.totalHeld)}</b></div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 bg-[var(--panel-2)] rounded-xl px-3 border-2 border-transparent focus-within:border-[var(--saffron)] flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--ink-2)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by user ID" className="flex-1 bg-transparent py-2.5 outline-none text-sm" />
        </label>
        <div className="flex gap-1.5">
          {(["all", "active", "blocked"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${filter === f ? "bg-[var(--navy)] text-white" : "bg-[var(--panel-2)] text-[var(--ink-2)]"}`}>
              {cap(f)} {f === "all" ? stats.total : f === "active" ? stats.active : stats.blocked}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-[var(--panel-2)] rounded-xl px-3 py-2 text-sm font-semibold">
          <option value="new">Newest first</option>
          <option value="high">Highest balance</option>
          <option value="low">Lowest balance</option>
        </select>
        <button onClick={() => setAddOpen(true)} className="bg-[var(--ok)] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={() => router.refresh()} className="p-2 rounded-xl bg-[var(--panel-2)] hover:bg-[var(--line)]"><RefreshCw className="w-4 h-4" /></button>
      </div>

            {/* DESKTOP: TABLE / MOBILE: CARDS */}
      <div className="bg-transparent md:bg-[var(--panel)] md:rounded-[var(--r)] md:overflow-hidden">
        
        {/* ================= DESKTOP TABLE ================= */}
        <table className="hidden md:table w-full text-left">
          <thead className="bg-[var(--panel-2)] text-[var(--ink-2)] text-xs uppercase">
            <tr>
              <th className="px-5 py-3 font-bold">User ID</th>
              <th className="px-5 py-3 font-bold">Balance</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 font-bold">PIN</th>
              <th className="px-5 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {visible.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--ink-2)]">No users found.</td></tr>
            ) : visible.map(u => (
              <tr key={u.id} className="hover:bg-[var(--panel-2)]">
                <td className="px-5 py-3 font-bold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[var(--navy)] text-white grid place-items-center text-xs font-extrabold">{String(u.id).slice(-2)}</span>
                  {u.id}
                </td>
                <td className="px-5 py-3">
                  {editingId === u.id ? (
                    <div className="flex items-center gap-2">
                      <input value={editBalance} onChange={e => setEditBalance(e.target.value)} className="w-24 border-2 border-[var(--saffron)] rounded-lg px-2 py-1 text-sm font-bold" autoFocus />
                      <button onClick={() => handleSaveBalance(u.id)} className="text-[var(--ok)] text-xs font-bold">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[var(--ink-2)] text-xs">Esc</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <b className={u.balance < 1000 ? "text-[var(--saffron)]" : "text-[var(--ok)]"}>{inr(u.balance)}</b>
                      <button onClick={() => { setEditingId(u.id); setEditBalance(String(u.balance)); }} className="p-1 rounded bg-[var(--panel-2)] hover:bg-[var(--line)]"><Edit3 className="w-3 h-3" /></button>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${u.status === "active" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                    {cap(u.status)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-[var(--panel-2)] rounded-lg px-2 py-1 text-sm font-bold tracking-widest">••••••</span>
                    <button onClick={() => setPinUser(u)} className="p-1 rounded bg-[var(--panel-2)] hover:bg-[var(--line)]"><Edit3 className="w-3 h-3" /></button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setManageUser(u)} className="p-1.5 rounded-lg bg-[var(--panel-2)] hover:bg-[var(--line)]"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= MOBILE CARDS ================= */}
        <div className="md:hidden grid gap-3">
          {visible.length === 0 ? (
            <div className="text-center py-8 text-[var(--ink-2)] bg-[var(--panel)] rounded-[var(--r)]">No users found.</div>
          ) : visible.map(u => (
            <div key={u.id} className="bg-[var(--panel-2)] rounded-[16px] p-4 grid gap-3">
              
              {/* Header: Avatar & ID */}
              <div className="flex items-center gap-2 font-extrabold text-[17px]">
                <span className="w-9 h-9 rounded-full bg-[var(--navy)] text-white grid place-items-center text-xs">{String(u.id).slice(-2)}</span>
                {u.id}
              </div>

              {/* Grid for Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[12px] font-semibold text-[var(--ink-2)]">Balance</span>
                  {editingId === u.id ? (
                     <div className="flex items-center gap-2 mt-1">
                       <input value={editBalance} onChange={e => setEditBalance(e.target.value)} className="w-20 border-2 border-[var(--saffron)] rounded-lg px-2 py-1 text-sm font-bold" autoFocus />
                       <button onClick={() => handleSaveBalance(u.id)} className="text-[var(--ok)] text-xs font-bold">Save</button>
                     </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-extrabold text-lg ${u.balance < 1000 ? "text-[var(--saffron)]" : "text-[var(--ok)]"}`}>{inr(u.balance)}</span>
                      <button onClick={() => { setEditingId(u.id); setEditBalance(String(u.balance)); }} className="p-1.5 rounded bg-[var(--blue-soft)] text-[var(--blue)]"><Edit3 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[12px] font-semibold text-[var(--ink-2)]">Status</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${u.status === "active" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {cap(u.status)}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-[12px] font-semibold text-[var(--ink-2)]">PIN</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-[var(--panel)] rounded-lg px-3 py-1.5 text-sm font-bold tracking-widest flex-1 text-center">••••••</span>
                    <button onClick={() => setPinUser(u)} className="p-2 rounded-lg bg-[var(--blue-soft)] text-[var(--blue)]"><Edit3 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <button onClick={() => setManageUser(u)} className="flex-1 py-2.5 rounded-xl bg-[var(--blue-soft)] text-[var(--blue)] font-bold text-sm flex justify-center items-center gap-2">
                  <Settings className="w-4 h-4" /> Manage
                </button>
                <button onClick={() => handleDelete(u.id)} className="flex-1 py-2.5 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] font-bold text-sm flex justify-center items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      {(addOpen || manageUser || pinUser) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center md:items-center items-end p-0 md:p-4" onClick={() => { setAddOpen(false); setManageUser(null); setPinUser(null); }}>
          <div className="bg-[var(--panel)] rounded-t-3xl md:rounded-[22px] w-full md:max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            {/* Add User Dialog */}
            {addOpen && (
              <>
                <h3 className="text-xl font-extrabold mb-4">Add new user</h3>
                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">User ID<input value={newUser.id} onChange={e => setNewUser({...newUser, id: e.target.value})} className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-3 py-2 text-[var(--ink)] outline-none" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">Starting Balance<input type="number" value={newUser.balance} onChange={e => setNewUser({...newUser, balance: e.target.value})} className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-3 py-2 text-[var(--ink)] outline-none" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">PIN (6 digits)<input type="password" maxLength={6} value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-3 py-2 text-[var(--ink)] outline-none tracking-widest" /></label>
                  {formErr && <p className="text-sm text-[var(--bad)] font-bold">{formErr}</p>}
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-xl bg-[var(--panel-2)] font-bold text-sm">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-[var(--ok)] text-white font-bold text-sm">Create</button>
                </div>
              </>
            )}

            {/* Manage Dialog */}
            {manageUser && (
              <>
                <h3 className="text-xl font-extrabold mb-4">Manage user {manageUser.id}</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-2 bg-[var(--panel-2)] p-4 rounded-xl text-sm">
                  <dt className="text-[var(--ink-2)]">Balance</dt><dd className="font-bold text-right">{inr(manageUser.balance)}</dd>
                  <dt className="text-[var(--ink-2)]">Status</dt><dd className="font-bold text-right">{cap(manageUser.status)}</dd>
                </dl>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setManageUser(null)} className="px-4 py-2 rounded-xl bg-[var(--panel-2)] font-bold text-sm">Close</button>
                  <button onClick={handleToggleStatus} className={`px-4 py-2 rounded-xl font-bold text-sm text-white ${manageUser.status === "active" ? "bg-[var(--bad)]" : "bg-[var(--ok)]"}`}>
                    {manageUser.status === "active" ? "Block user" : "Unblock user"}
                  </button>
                </div>
              </>
            )}

            {/* PIN Dialog */}
            {pinUser && (
              <>
                <h3 className="text-xl font-extrabold mb-4">Change PIN for {pinUser.id}</h3>
                <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">New 6-digit PIN<input type="password" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value)} className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-3 py-2 text-[var(--ink)] outline-none tracking-widest" /></label>
                {formErr && <p className="text-sm text-[var(--bad)] font-bold mt-2">{formErr}</p>}
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setPinUser(null)} className="px-4 py-2 rounded-xl bg-[var(--panel-2)] font-bold text-sm">Cancel</button>
                  <button onClick={handleChangePin} className="px-4 py-2 rounded-xl bg-[var(--navy)] text-white font-bold text-sm">Save PIN</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}