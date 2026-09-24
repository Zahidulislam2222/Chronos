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

function ConnectedSuccess() {
  const {state,clearCart,isLoading:cartLoading} = useCart();
  const {user,isLoading} = useAuth();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const result = useQuery({queryKey:["verify-payment",user?.id,sessionId],queryFn:()=>authenticatedRequest("chronos/v1/stripe/verify-session",{sessionId}),enabled:Boolean(sessionId && user && !isLoading)});
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
  return <Layout><section className="container section"><h1>{sessionId && result.isFetching ? c.confirming : paid ? c.paid : c.unpaid}</h1><p>{c.notice}</p><Link className="text-link" to={paid ? "/account" : "/checkout"}>{paid ? c.account : c.retry}</Link></section></Layout>;
}
export default function CheckoutSuccess() { return isPreview ? <Checkout /> : <ConnectedSuccess />; }
