import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { fetchCustomerOrders } from "@/utils/api";
import { connectedContent, content } from "@/content";

export default function ConnectedAccount() {
  const {user,isLoading,openLoginModal,logout}=useAuth();
  const orders=useQuery({queryKey:["customer-orders",user?.id],queryFn:fetchCustomerOrders,enabled:Boolean(user)});
  const c=connectedContent.account;
  return <Layout><section className="container section"><h1>{c.title}</h1>
    {isLoading ? <p>{content.ui.loading}</p> : !user ? <button className="button button-dark" onClick={openLoginModal}>{c.signIn}</button> : <>
      <p>{user.name}</p><button className="text-link" onClick={logout}>{c.logout}</button><h2>{c.orders}</h2>
      {orders.isFetching && <p>{content.ui.loading}</p>}
      {orders.isError ? <p role="alert">{c.failure} <button onClick={()=>orders.refetch()}>{content.ui.retry}</button></p> : orders.data?.length ? <ul>{orders.data.map(o=><li key={o.orderNumber}>#{o.orderNumber} — {o.status} — {o.total}</li>)}</ul> : !orders.isFetching && <p>{c.empty}</p>}
    </>}
  </section></Layout>;
}
