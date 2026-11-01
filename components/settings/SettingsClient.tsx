"use client";

import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { adminCreateDeposit, adminCreateWithdraw, adminCreateUser, adminDeleteDeposit, adminDeleteWithdraw } from "@/actions/admin";
import { LogOut, Trash2, UserPlus, ArrowDownLeft, ArrowUpRight, Key, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { LogoUploader } from "./LogoUploader";

type PendingDeposit = { id: number; utr: string };
type PendingWithdraw = { id: number; upiId: string };

type ActionType = "create_deposit" | "create_withdraw" | "create_user" | "delete" | "profile" | null;

export function SettingsClient({ admin, depositOrders, withdrawOrders }: { admin: any; depositOrders: PendingDeposit[]; withdrawOrders: PendingWithdraw[] }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  // Form States
  const [depForm, setDepForm] = useState({ userId: "", price: "", tokens: "", utr: "" });
  const [wdForm, setWdForm] = useState({ userId: "", price: "", tokens: "", upiId: "" });
  const [userForm, setUserForm] = useState({ id: "", balance: "0", pin: "" });

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminCreateDeposit({
      userId: Number(depForm.userId),
      price: Number(depForm.price),
      tokens: Number(depForm.tokens),
      utr: depForm.utr,
    });
    if (res.error) toast(res.error);
    else { toast("Deposit order created"); setDepForm({ userId: "", price: "", tokens: "", utr: "" }); setActiveAction(null); router.refresh(); }
  };

  const handleCreateWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminCreateWithdraw({
      userId: Number(wdForm.userId),
      price: Number(wdForm.price),
      tokens: Number(wdForm.tokens),
      upiId: wdForm.upiId,
    });
    if (res.error) toast(res.error);
    else { toast("Withdraw order created"); setWdForm({ userId: "", price: "", tokens: "", upiId: "" }); setActiveAction(null); router.refresh(); }
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

  const handleDeleteDeposit = async (id: number) => {
    if (!confirm(`Delete deposit order #${id}?`)) return;
    const res = await adminDeleteDeposit(id);
    if (res.error) toast(res.error);
    else { toast(`Deposit #${id} deleted`); router.refresh(); }
  };

  const handleDeleteWithdraw = async (id: number) => {
    if (!confirm(`Delete withdraw order #${id}?`)) return;
    const res = await adminDeleteWithdraw(id);
    if (res.error) toast(res.error);
    else { toast(`Withdraw #${id} deleted`); router.refresh(); }
  };

  return (
    <div className="grid gap-6">
      
      {/* Premium Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Deposit Card */}
        <button onClick={() => setActiveAction("create_deposit")} className="group bg-[var(--panel)] rounded-[var(--r)] p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ok-soft)] text-[var(--ok)] grid place-items-center mb-4 group-hover:bg-[var(--ok)] group-hover:text-white transition-colors">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold mb-1">Create Deposit</h3>
          <p className="text-sm text-[var(--ink-2)] group-hover:text-[#8da0c0]">Manually add a deposit order for a user.</p>
        </button>

        {/* Withdraw Card */}
        <button onClick={() => setActiveAction("create_withdraw")} className="group bg-[var(--panel)] rounded-[var(--r)] p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--saffron-soft)] text-[var(--saffron)] grid place-items-center mb-4 group-hover:bg-[var(--saffron)] group-hover:text-white transition-colors">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold mb-1">Create Withdraw</h3>
          <p className="text-sm text-[var(--ink-2)] group-hover:text-[#8da0c0]">Manually add a withdrawal order.</p>
        </button>

        {/* User Card */}
        <button onClick={() => setActiveAction("create_user")} className="group bg-[var(--panel)] rounded-[var(--r)] p-6 text-left hover:bg-[var(--navy)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--blue-soft)] text-[var(--blue)] grid place-items-center mb-4 group-hover:bg-[var(--blue)] group-hover:text-white transition-colors">
            <UserPlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold mb-1">Create User</h3>
          <p className="text-sm text-[var(--ink-2)] group-hover:text-[#8da0c0]">Add a new user to the system.</p>
        </button>

        {/* Delete Card */}
        <button onClick={() => setActiveAction("delete")} className="group bg-[var(--panel)] rounded-[var(--r)] p-6 text-left hover:bg-[var(--bad)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bad-soft)] text-[var(--bad)] grid place-items-center mb-4 group-hover:bg-white group-hover:text-[var(--bad)] transition-colors">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold mb-1">Delete Orders</h3>
          <p className="text-sm text-[var(--ink-2)] group-hover:text-white/80">Remove pending deposit or withdraw orders.</p>
        </button>
      </div>

            {/* Profile Card (Always Visible) */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-6 relative">
        {/* Logout button - Top Right */}
        <button 
          onClick={() => logoutAction()} 
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] font-bold text-sm hover:bg-[var(--bad)] hover:text-white transition-colors md:static md:ml-auto"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
        </button>

        {/* Profile Info */}
        <div className="flex items-center gap-4 pr-20 md:pr-0 md:flex-row md:justify-between md:items-center md:gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--navy)] text-white flex items-center justify-center text-xl font-extrabold shrink-0">
              {admin.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold">{admin.email}</h2>
              <p className="text-[var(--ink-2)] text-sm capitalize">Role: {admin.role}</p>
            </div>
          </div>
        </div>
      </div>

       {/* Logo Uploader */}
      <LogoUploader />

      {/* Modal for Active Action */}
      {activeAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveAction(null)}>
          <div className="bg-[var(--panel)] rounded-[22px] w-full max-w-lg p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            <button onClick={() => setActiveAction(null)} className="absolute top-4 right-4 p-2 rounded-full bg-[var(--panel-2)] hover:bg-[var(--line)]">
              <X className="w-5 h-5" />
            </button>

            {/* CREATE DEPOSIT FORM */}
            {activeAction === "create_deposit" && (
              <form onSubmit={handleCreateDeposit} className="grid gap-4">
                <h2 className="text-2xl font-extrabold mb-2">Create Deposit</h2>
                <div className="grid grid-cols-2 gap-4">
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">User ID<input required type="number" value={depForm.userId} onChange={e => setDepForm({...depForm, userId: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">Amount (₹)<input required type="number" value={depForm.price} onChange={e => setDepForm({...depForm, price: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">Tokens<input required type="number" value={depForm.tokens} onChange={e => setDepForm({...depForm, tokens: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">UTR<input required value={depForm.utr} onChange={e => setDepForm({...depForm, utr: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                </div>
                <button type="submit" className="bg-[var(--ok)] text-white py-3 rounded-xl font-bold mt-2 hover:bg-[#0b8a4c] transition-colors">Create Deposit</button>
              </form>
            )}

            {/* CREATE WITHDRAW FORM */}
            {activeAction === "create_withdraw" && (
              <form onSubmit={handleCreateWithdraw} className="grid gap-4">
                <h2 className="text-2xl font-extrabold mb-2">Create Withdraw</h2>
                <div className="grid grid-cols-2 gap-4">
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">User ID<input required type="number" value={wdForm.userId} onChange={e => setWdForm({...wdForm, userId: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">Amount (₹)<input required type="number" value={wdForm.price} onChange={e => setWdForm({...wdForm, price: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">Tokens<input required type="number" value={wdForm.tokens} onChange={e => setWdForm({...wdForm, tokens: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                  <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">UPI ID<input required value={wdForm.upiId} onChange={e => setWdForm({...wdForm, upiId: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                </div>
                <button type="submit" className="bg-[var(--saffron)] text-white py-3 rounded-xl font-bold mt-2 hover:bg-[#e67a00] transition-colors">Create Withdraw</button>
              </form>
            )}

            {/* CREATE USER FORM */}
            {activeAction === "create_user" && (
              <form onSubmit={handleCreateUser} className="grid gap-4">
                <h2 className="text-2xl font-extrabold mb-2">Create New User</h2>
                <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">User ID (6+ digits)<input required type="number" value={userForm.id} onChange={e => setUserForm({...userForm, id: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">Starting Balance<input required type="number" value={userForm.balance} onChange={e => setUserForm({...userForm, balance: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                <label className="grid gap-1 text-sm font-bold text-[var(--ink-2)]">PIN (6 digits)<input required type="password" maxLength={6} value={userForm.pin} onChange={e => setUserForm({...userForm, pin: e.target.value})} className="bg-[var(--panel-2)] rounded-xl px-3 py-2.5 text-[var(--ink)] outline-none tracking-widest focus:ring-2 focus:ring-[var(--saffron)]" /></label>
                <button type="submit" className="bg-[var(--blue)] text-white py-3 rounded-xl font-bold mt-2 hover:bg-blue-700 transition-colors">Create User</button>
              </form>
            )}

            {/* DELETE ORDERS */}
            {activeAction === "delete" && (
              <div className="grid gap-6">
                <h2 className="text-2xl font-extrabold mb-2 text-[var(--bad)]">Delete Pending Orders</h2>
                
                <div>
                  <h3 className="text-md font-bold mb-3 text-[var(--ink-2)]">Deposits</h3>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {depositOrders.length === 0 ? <p className="text-sm text-[var(--ink-2)]">No pending deposits.</p> : depositOrders.map(o => (
                      <div key={o.id} className="flex justify-between items-center bg-[var(--panel-2)] p-3 rounded-xl border border-transparent hover:border-[var(--bad-soft)] transition-colors">
                        <span className="font-mono text-sm">#{o.id} · {o.utr}</span>
                        <button onClick={() => handleDeleteDeposit(o.id)} className="p-2 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-bold mb-3 text-[var(--ink-2)]">Withdrawals</h3>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {withdrawOrders.length === 0 ? <p className="text-sm text-[var(--ink-2)]">No pending withdrawals.</p> : withdrawOrders.map(o => (
                      <div key={o.id} className="flex justify-between items-center bg-[var(--panel-2)] p-3 rounded-xl border border-transparent hover:border-[var(--bad-soft)] transition-colors">
                        <span className="font-mono text-sm">#{o.id} · {o.upiId}</span>
                        <button onClick={() => handleDeleteWithdraw(o.id)} className="p-2 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
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