import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/utils/api";
import { connectedContent } from "@/content";

export default function LoginModal() {
  const {isLoginModalOpen,closeLoginModal,login,register}=useAuth();
  const [creating,setCreating]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const c=connectedContent.auth;
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError("");
    const form=new FormData(e.currentTarget);
    try {
      if(creating) await register(String(form.get("name")),String(form.get("email")),String(form.get("password")));
      else { const data=await loginUser(String(form.get("email")),String(form.get("password"))); if(!data?.authToken) throw new Error(c.failure); login(data.user,data.authToken); }
    } catch {setError(c.failure);} finally {setBusy(false);}
  }
  return <Dialog open={isLoginModalOpen} onOpenChange={open=>{if(!open)closeLoginModal();}}><DialogContent>
    <DialogTitle>{creating?c.register:c.login}</DialogTitle><DialogDescription>{c.notice}</DialogDescription>
    <form onSubmit={submit} className="space-y-4">
      {creating && <div><label htmlFor="auth-name">{c.name}</label><input className="w-full border p-3" id="auth-name" name="name" required maxLength={100} autoComplete="name" /></div>}
      <div><label htmlFor="auth-email">{c.email}</label><input className="w-full border p-3" id="auth-email" name="email" type="email" required autoComplete="username" /></div>
      <div><label htmlFor="auth-password">{c.password}</label><input className="w-full border p-3" id="auth-password" name="password" type="password" required minLength={creating?12:1} autoComplete={creating?"new-password":"current-password"} /></div>
      <button className="button button-dark" disabled={busy}>{busy?c.pending:creating?c.register:c.login}</button>
      {error && <p role="alert">{error}</p>}
    </form><button className="text-link" onClick={()=>{setCreating(!creating);setError("");}} disabled={busy}>{creating?c.login:c.register}</button>
  </DialogContent></Dialog>;
}
