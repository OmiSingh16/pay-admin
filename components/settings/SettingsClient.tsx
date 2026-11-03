"use client";

import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import {
  adminCreateDeposit,
  adminCreateWithdraw,
  adminCreateUser,
  adminCreateUpi,
  adminDeleteDeposit,
  adminDeleteWithdraw,
  adminDeleteUpiByUserId,
} from "@/actions/admin";
import {
  LogOut,
  Trash2,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Key,
  X,
  Landmark,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { LogoUploader } from "./LogoUploader";

type PendingDeposit = { id: number; utr: string };
type PendingWithdraw = { id: number; upiId: string };
type PendingUpi = { id: number; upiId: string };

type ActionType =
  | "create_deposit"
  | "create_withdraw"
  | "create_user"
  | "create_upi"
  | "delete"
  | "profile"
  | null;

export function SettingsClient({
  admin,
  depositOrders,
  withdrawOrders,
  upiRequests,
}: {
  admin: any;
  depositOrders: PendingDeposit[];
  withdrawOrders: PendingWithdraw[];
  upiRequests: PendingUpi[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [activeAction, setActiveAction] = useState<ActionType>(null);

  const [depForm, setDepForm] = useState({ userId: "", price: "", tokens: "", utr: "", dealDate: "" });
  const [wdForm, setWdForm] = useState({ userId: "", price: "", upiId: "" });
  const [userForm, setUserForm] = useState({ id: "", balance: "0", pin: "" });
  const [upiForm, setUpiForm] = useState({ userId: "", upiId: "", enabled: true });

  const [deleteDepId, setDeleteDepId] = useState("");
  const [deleteWdId, setDeleteWdId] = useState("");
  const [deleteUpiUserId, setDeleteUpiUserId] = useState("");

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depForm.dealDate) { toast("Please select a date"); return; }
    const res = await adminCreateDeposit({
      userId: Number(depForm.userId),
      price: Number(depForm.price),
      tokens: Number(depForm.tokens),
      utr: depForm.utr,
      dealDate: depForm.dealDate,
    });
    if (res.error) toast(res.error);
    else { toast("Deposit order created"); setDepForm({ userId: "", price: "", tokens: "", utr: "", dealDate: "" }); setActiveAction(null); router.refresh(); }
  };

  const handleCreateWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminCreateWithdraw({
      userId: Number(wdForm.userId),
      price: Number(wdForm.price),
      tokens: Number(wdForm.price),
      upiId: wdForm.upiId,
    });
    if (res.error) toast(res.error);
    else { toast("Withdraw order created"); setWdForm({ userId: "", price: "", upiId: "" }); setActiveAction(null); router.refresh(); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminCreateUser({
      id: Number(userForm.id),
      balance: Number(userForm.balance),
      pin: userForm.pin,
    });
    if (res.error) toast(res.error);
    else { toast("User created"); setUserForm({ id: "", balance: "0", pin: "" }); setActiveAction(null); router.refresh(); }
  };

  const handleCreateUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminCreateUpi({
      userId: Number(upiForm.userId),
      upiId: upiForm.upiId,
      enabled: upiForm.enabled,
    });
    if (res.error) toast(res.error);
    else { toast("UPI request created"); setUpiForm({ userId: "", upiId: "", enabled: true }); setActiveAction(null); router.refresh(); }
  };

  const handleDeleteDeposit = async (id: number) => {
    const res = await adminDeleteDeposit(id);
    if (res.error) toast(res.error);
    else { toast(`Deposit #${id} deleted`, () => router.refresh()); router.refresh(); }
  };

  const handleDeleteWithdraw = async (id: number) => {
    const res = await adminDeleteWithdraw(id);
    if (res.error) toast(res.error);
    else { toast(`Withdraw #${id} deleted`, () => router.refresh()); router.refresh(); }
  };

  const handleDeleteDepById = async () => {
    const id = Number(deleteDepId);
    if (!id) { toast("Enter a valid order ID"); return; }
    const res = await adminDeleteDeposit(id);
    if (res.error) toast(res.error);
    else { toast(`Deposit #${id} deleted`, () => router.refresh()); setDeleteDepId(""); router.refresh(); }
  };

  const handleDeleteWdById = async () => {
    const id = Number(deleteWdId);
    if (!id) { toast("Enter a valid order ID"); return; }
    const res = await adminDeleteWithdraw(id);
    if (res.error) toast(res.error);
    else { toast(`Withdraw #${id} deleted`, () => router.refresh()); setDeleteWdId(""); router.refresh(); }
  };

  const handleDeleteUpiByUserId = async () => {
    const userId = Number(deleteUpiUserId);
    if (!userId) { toast("Enter a valid User ID"); return; }
    const res = await adminDeleteUpiByUserId(userId);
    if (res.error) toast(res.error);
    else { toast(`UPI requests for User #${userId} deleted`, () => router.refresh()); setDeleteUpiUserId(""); router.refresh(); }
  };

  return (
    <div className="grid gap-4 md:gap-6">
      {/* Premium Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Deposit Card */}
        <button onClick={() => setActiveAction("create_deposit")} className="group bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--ok-soft)] text-[var(--ok)] grid place-items-center mb-3 md:mb-4 group-hover:bg-[var(--ok)] group-hover:text-white transition-colors">
            <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-extrabold mb-1 leading-tight">Create Deposit</h3>
        </button>

        {/* Withdraw Card */}
        <button onClick={() => setActiveAction("create_withdraw")} className="group bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--saffron-soft)] text-[var(--saffron)] grid place-items-center mb-3 md:mb-4 group-hover:bg-[var(--saffron)] group-hover:text-white transition-colors">
            <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-extrabold mb-1 leading-tight">Create Withdraw</h3>
        </button>

        {/* User Card */}
        <button onClick={() => setActiveAction("create_user")} className="group bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--blue-soft)] text-[var(--blue)] grid place-items-center mb-3 md:mb-4 group-hover:bg-[var(--blue)] group-hover:text-white transition-colors">
            <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-extrabold mb-1 leading-tight">Create User</h3>
        </button>

        {/* UPI Card */}
        <button onClick={() => setActiveAction("create_upi")} className="group bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-100 text-indigo-700 grid place-items-center mb-3 md:mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Landmark className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-extrabold mb-1 leading-tight">Create UPI</h3>
        </button>

        {/* Delete Card */}
        <button onClick={() => setActiveAction("delete")} className="group bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-6 text-left hover:bg-[var(--bad)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--bad-soft)] text-[var(--bad)] grid place-items-center mb-3 md:mb-4 group-hover:bg-white group-hover:text-[var(--bad)] transition-colors">
            <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-extrabold mb-1 leading-tight">Delete Orders</h3>
        </button>
      </div>

      {/* Logo Uploader */}
      <LogoUploader />

      {/* Profile Card */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-6 relative">
        <button onClick={async () => { await logoutAction(); window.location.href = "/login?logout=true"; }} className="absolute top-4 right-4 flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] font-bold text-xs md:text-sm hover:bg-[var(--bad)] hover:text-white transition-colors md:static md:ml-auto">
          <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
        </button>
        <div className="flex items-center gap-3 md:gap-4 pr-16 md:pr-0 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--navy)] text-white flex items-center justify-center text-lg md:text-xl font-extrabold shrink-0">
              {admin.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm md:text-lg font-extrabold truncate">{admin.email}</h2>
              <p className="text-[var(--ink-2)] text-xs md:text-sm capitalize">Role: {admin.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Active Action */}
      {activeAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setActiveAction(null)}>
          <div className="bg-[var(--panel)] rounded-t-[22px] md:rounded-[22px] w-full md:max-w-lg p-5 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveAction(null)} className="absolute top-4 right-4 p-2 rounded-full bg-[var(--panel-2)] hover:bg-[var(--line)]">
              <X className="w-5 h-5" />
            </button>

            {/* CREATE DEPOSIT FORM */}
            {activeAction === "create_deposit" && (
              <form onSubmit={handleCreateDeposit} className="grid gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Create Deposit</h2>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">User ID<input required type="number" value={depForm.userId} onChange={(e) => setDepForm({ ...depForm, userId: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">Amount (₹)<input required type="number" value={depForm.price} onChange={(e) => setDepForm({ ...depForm, price: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">Tokens<input required type="number" value={depForm.tokens} onChange={(e) => setDepForm({ ...depForm, tokens: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">UTR<input required value={depForm.utr} onChange={(e) => setDepForm({ ...depForm, utr: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">Date & Time<input required type="datetime-local" value={depForm.dealDate} onChange={(e) => setDepForm({ ...depForm, dealDate: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                </div>
                <button type="submit" className="bg-[var(--ok)] text-white py-3 rounded-xl font-bold mt-2 hover:bg-[#0b8a4c] transition-colors text-sm md:text-base">Create Deposit</button>
              </form>
            )}

            {/* CREATE WITHDRAW FORM */}
            {activeAction === "create_withdraw" && (
              <form onSubmit={handleCreateWithdraw} className="grid gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Create Withdraw</h2>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">User ID<input required type="number" value={wdForm.userId} onChange={(e) => setWdForm({ ...wdForm, userId: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">Amount (₹)<input required type="number" value={wdForm.price} onChange={(e) => setWdForm({ ...wdForm, price: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                  <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">UPI ID<input required value={wdForm.upiId} onChange={(e) => setWdForm({ ...wdForm, upiId: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                </div>
                <button type="submit" className="bg-[var(--saffron)] text-white py-3 rounded-xl font-bold mt-2 hover:bg-[#e67a00] transition-colors text-sm md:text-base">Create Withdraw</button>
              </form>
            )}

            {/* CREATE USER FORM */}
            {activeAction === "create_user" && (
              <form onSubmit={handleCreateUser} className="grid gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Create New User</h2>
                <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">User ID (6+ digits)<input required type="number" value={userForm.id} onChange={(e) => setUserForm({ ...userForm, id: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">Starting Balance<input required type="number" value={userForm.balance} onChange={(e) => setUserForm({ ...userForm, balance: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">PIN (6 digits)<input required type="password" maxLength={6} value={userForm.pin} onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none tracking-widest focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-blue-700 transition-colors text-sm md:text-base">Create User</button>
              </form>
            )}

            {/* CREATE UPI FORM */}
            {activeAction === "create_upi" && (
              <form onSubmit={handleCreateUpi} className="grid gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Create UPI Request</h2>
                <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">User ID<input required type="number" value={upiForm.userId} onChange={(e) => setUpiForm({ ...upiForm, userId: e.target.value })} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                <label className="grid gap-1 text-xs md:text-sm font-bold text-[var(--ink-2)]">UPI ID<input required value={upiForm.upiId} onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })} placeholder="user@ybl" className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)] text-sm" /></label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--panel-2)] cursor-pointer">
                  <input type="checkbox" checked={upiForm.enabled} onChange={(e) => setUpiForm({ ...upiForm, enabled: e.target.checked })} className="w-4 h-4 rounded accent-[var(--ok)]" />
                  <span className="text-sm font-bold text-[var(--ink)]">Enabled by default</span>
                </label>
                <button type="submit" className="bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-indigo-700 transition-colors text-sm md:text-base">Create UPI Request</button>
              </form>
            )}

            {/* DELETE ORDERS */}
            {activeAction === "delete" && (
              <div className="grid gap-4 md:gap-6">
                <h2 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2 text-[var(--bad)]">Delete Orders</h2>
                <div className="grid gap-4 pb-4 border-b border-[var(--line)]">
                  <h3 className="text-sm md:text-md font-bold text-[var(--ink-2)]">Delete by Order ID</h3>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Deposit Order ID" value={deleteDepId} onChange={e => setDeleteDepId(e.target.value)} className="flex-1 bg-[var(--panel-2)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--bad)]" />
                    <button onClick={handleDeleteDepById} className="px-4 py-2 rounded-xl bg-[var(--bad)] text-white font-bold text-sm hover:bg-[#b02e2e] transition-colors whitespace-nowrap">Delete Deposit</button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Withdraw Order ID" value={deleteWdId} onChange={e => setDeleteWdId(e.target.value)} className="flex-1 bg-[var(--panel-2)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--bad)]" />
                    <button onClick={handleDeleteWdById} className="px-4 py-2 rounded-xl bg-[var(--bad)] text-white font-bold text-sm hover:bg-[#b02e2e] transition-colors whitespace-nowrap">Delete Withdraw</button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="User ID (for UPI delete)" value={deleteUpiUserId} onChange={(e) => setDeleteUpiUserId(e.target.value)} className="flex-1 bg-[var(--panel-2)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--bad)]" />
                    <button onClick={handleDeleteUpiByUserId} className="px-4 py-2 rounded-xl bg-[var(--bad)] text-white font-bold text-sm hover:bg-[#b02e2e] transition-colors whitespace-nowrap">Delete UPI</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-md font-bold mb-2 md:mb-3 text-[var(--ink-2)]">Pending Deposits</h3>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {depositOrders.length === 0 ? <p className="text-xs md:text-sm text-[var(--ink-2)]">No pending deposits.</p> : depositOrders.map((o) => (
                      <div key={o.id} className="flex justify-between items-center bg-[var(--panel-2)] p-2.5 md:p-3 rounded-xl border border-transparent hover:border-[var(--bad-soft)] transition-colors">
                        <span className="font-mono text-xs md:text-sm truncate pr-2">#{o.id} · {o.utr}</span>
                        <button onClick={() => handleDeleteDeposit(o.id)} className="p-1.5 md:p-2 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-md font-bold mb-2 md:mb-3 text-[var(--ink-2)]">Pending Withdrawals</h3>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {withdrawOrders.length === 0 ? <p className="text-xs md:text-sm text-[var(--ink-2)]">No pending withdrawals.</p> : withdrawOrders.map((o) => (
                      <div key={o.id} className="flex justify-between items-center bg-[var(--panel-2)] p-2.5 md:p-3 rounded-xl border border-transparent hover:border-[var(--bad-soft)] transition-colors">
                        <span className="font-mono text-xs md:text-sm truncate pr-2">#{o.id} · {o.upiId}</span>
                        <button onClick={() => handleDeleteWithdraw(o.id)} className="p-1.5 md:p-2 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}