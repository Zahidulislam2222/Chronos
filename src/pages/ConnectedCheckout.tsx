import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { connectedContent, content } from "@/content";
import { authenticatedRequest, wordpressRequest, WordPressError } from "@/utils/wordpressApi";
import { stripeCheckoutOrigin } from "@/config/forms";
import { storageKeys } from "@/config/settings";
import { useMoney } from "@/hooks/use-money";

export default function ConnectedCheckout() {
  const money = useMoney();
  const {user,openLoginModal} = useAuth();
  const {state,totalPrice} = useCart();
  const [giftWrapping,setGift] = useState(false);
  const [deliveryInstructions,setInstructions] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [canRestart,setCanRestart] = useState(false);
  const config = useQuery({queryKey:["checkout-config"],queryFn:()=>wordpressRequest("chronos/v1/stripe/config")});
  const c = connectedContent.checkout;
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const items = state.items.map(i=>({productId:Number(i.product.id),quantity:i.quantity}));
    const fingerprint = JSON.stringify({items,giftWrapping,deliveryInstructions});
    try {
      const key = storageKeys.checkoutAttemptPrefix + user?.id;
      let attempt: {fingerprint?:string;id?:string}|null = null;
      try { attempt = JSON.parse(localStorage.getItem(key) || "null"); } catch { /* Replace malformed local attempt data. */ }
      const requestId = attempt?.fingerprint === fingerprint && typeof attempt.id === "string" ? attempt.id : crypto.randomUUID();
      localStorage.setItem(key,JSON.stringify({fingerprint,id:requestId}));
      const result = await authenticatedRequest("chronos/v1/stripe/create-session",{items,giftWrapping,deliveryInstructions,requestId});
      const url = new URL(result?.data?.url);
      if (url.origin !== stripeCheckoutOrigin || result?.data?.testMode !== true) throw new Error(c.unavailable);
      localStorage.setItem(key,JSON.stringify({fingerprint,id:requestId,orderId:result.data.orderId}));
      window.location.assign(url.href);
    } catch (e) { setError(e instanceof Error ? e.message : c.unavailable); setCanRestart(e instanceof WordPressError && ["session_closed","checkout_changed","already_paid"].includes(e.code)); setBusy(false); }
  }
  return <Layout><section className="container section"><h1>{c.title}</h1><p>{c.notice}</p><p>{c.noEmail}</p>
    {!state.items.length ? <><p>{content.ui.emptyBag}</p><Link to="/shop">{content.ui.continue}</Link></> : <div className="contact-grid">
      <div>{state.items.map(i=><p key={i.product.id}>{i.product.name} × {i.quantity} — {money(i.product.price*i.quantity)}</p>)}<p>{content.ui.subtotal}: {money(totalPrice)}</p></div>
      {!user ? <button className="button button-dark" onClick={openLoginModal}>{c.signIn}</button> : <form onSubmit={submit}>
        <label><input type="checkbox" checked={giftWrapping} onChange={e=>setGift(e.target.checked)} /> {c.gift}</label>
        <label htmlFor="delivery-instructions">{c.instructions}</label><textarea id="delivery-instructions" value={deliveryInstructions} onChange={e=>setInstructions(e.target.value)} />
        <button className="button button-dark" disabled={busy || config.data?.data?.available !== true || config.data?.data?.testMode !== true}>{busy ? c.pending : c.submit}</button>
        {(config.isError || config.data?.data?.available === false) && <p role="alert">{c.unavailable}</p>}
        {error && <><p role="alert">{error}</p>{canRestart && <button type="button" onClick={()=>{localStorage.removeItem(storageKeys.checkoutAttemptPrefix+user.id);setCanRestart(false);setError("");}}>{c.retry}</button>}</>}
      </form>}
    </div>}
  </section></Layout>;
}
