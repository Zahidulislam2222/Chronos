import { isPreview, storageKeys } from "@/config/settings";
import { useAuth } from "@/context/AuthContext";
import Checkout from "./Checkout";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { authenticatedRequest } from "@/utils/wordpressApi";
import { connectedContent } from "@/content";
import { checkoutSuccessState } from "./checkoutSuccessState";

function ConnectedSuccess() {
  const {state,clearCart,isLoading:cartLoading} = useCart();
  const {user,isLoading,openLoginModal} = useAuth();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const result = useQuery({queryKey:["verify-payment",user?.id,sessionId],queryFn:()=>authenticatedRequest("chronos/v1/stripe/verify-session",{sessionId}),enabled:Boolean(sessionId && user && !isLoading),
    // One answer per visit: no background re-checks that would flip the heading or call Stripe again.
    staleTime:Infinity,refetchInterval:false,refetchOnWindowFocus:false});
  const paid = result.data?.data?.paid === true;
  useEffect(()=>{
    if(!paid || !user || cartLoading) return;
    try {
      const key=storageKeys.checkoutAttemptPrefix+user.id;
      const attempt=JSON.parse(localStorage.getItem(key)||"null");
      if(attempt?.orderId===result.data?.data?.orderId){
        localStorage.removeItem(key);
        const original=JSON.parse(attempt.fingerprint);
        const current=state.items.map(i=>({productId:Number(i.product.id),quantity:i.quantity}));
        if(JSON.stringify(original.items)===JSON.stringify(current)) clearCart();
      }
    } catch { /* A historical receipt must not clear an unrelated selection. */ }
  },[paid,clearCart,user,cartLoading,result.data,state.items]);
  const c=connectedContent.checkout;
  const view=checkoutSuccessState({hasSession:Boolean(sessionId),authLoading:isLoading,signedIn:Boolean(user),checking:result.isFetching && result.data===undefined,failed:result.isError,paid:result.isSuccess ? (result.data?.data?.paid ?? null) : undefined});
  const heading={missing:c.missingSession,checking:c.confirming,signIn:c.signInToVerify,unknown:c.verifyFailed,paid:c.paid,unpaid:c.unpaid}[view];
  return <Layout><section className="container section"><h1 aria-live="polite">{heading}</h1><p>{c.notice}</p>
    {view==="signIn" ? <button type="button" className="text-link" onClick={openLoginModal}>{connectedContent.auth.login}</button>
    : view==="unknown" ? <button type="button" className="text-link" onClick={()=>void result.refetch()}>{c.verifyAgain}</button>
    : view==="paid" ? <Link className="text-link" to="/account">{c.account}</Link>
    : view==="unpaid" || view==="missing" ? <Link className="text-link" to="/checkout">{c.retry}</Link> : null}
  </section></Layout>;
}
export default function CheckoutSuccess() { return isPreview ? <Checkout /> : <ConnectedSuccess />; }
