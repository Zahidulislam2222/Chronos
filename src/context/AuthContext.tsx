import { isPreview, storageKeys } from "@/config/settings";
import React, {createContext,useContext,useState,useEffect,ReactNode,useCallback} from "react";
import {loginUser,registerUser} from "@/utils/api";
import {storeAuthToken,clearAuthToken,AUTH_EXPIRED_EVENT} from "@/utils/authToken";
import {restoreSession} from "@/utils/session";
export interface User {id:string;name:string;email:string;avatar?:string;}
interface AuthContextType {user:User|null;isLoginModalOpen:boolean;openLoginModal:()=>void;closeLoginModal:()=>void;login:(user:User,token:string)=>void;register:(name:string,email:string,password:string)=>Promise<User>;logout:()=>void;isLoading:boolean;}
const AuthContext=createContext<AuthContextType|null>(null);
export const AuthProvider:React.FC<{children:ReactNode}>=({children})=>{
  const [user,setUser]=useState<User|null>(null);
  const [isLoginModalOpen,setModal]=useState(false);
  const [isLoading,setLoading]=useState(true);
  // The token itself is removed by whoever found it no longer works (see authToken.ts),
  // so a late answer about an old token cannot remove a newer one.
  const forget=useCallback(()=>{
    try {localStorage.removeItem("user-data");localStorage.removeItem("woo-session");} catch { /* Storage can be disabled. */ }
    setUser(null);
  },[]);
  useEffect(()=>{
    let active=true;
    // A session that ends signs out quietly. Pages that need an account show their own
    // sign-in button, so nothing pops up while someone is just reading or browsing.
    const expired=()=>forget();
    window.addEventListener(AUTH_EXPIRED_EVENT,expired);
    async function restore(){
      try {
        if(isPreview) return;
        const restored=await restoreSession();
        if(active && restored.current) setUser(restored.user);
      }
      finally {if(active)setLoading(false);}
    }
    void restore();
    return ()=>{active=false;window.removeEventListener(AUTH_EXPIRED_EVENT,expired);};
  },[forget]);
  const login=(next:User,token:string)=>{
    storeAuthToken(token);
    setUser(next);setModal(false);
  };
  const register=async(name:string,email:string,password:string)=>{
    const created=await registerUser(name,email,password);
    if(!created)throw new Error("Registration failed.");
    const signedIn=await loginUser(email,password);
    if(!signedIn?.authToken)throw new Error("Please sign in to your new account.");
    const next={...signedIn.user,name};login(next,signedIn.authToken);return next;
  };
  const logout=()=>{
    clearAuthToken();
    forget();
    try {localStorage.removeItem(storageKeys.guestCart);} catch { /* In-memory state clears on navigation. */ }
    window.location.assign("/");
  };
  return <AuthContext.Provider value={{user,isLoginModalOpen,openLoginModal:()=>setModal(true),closeLoginModal:()=>setModal(false),login,register,logout,isLoading}}>{children}</AuthContext.Provider>;
};
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used within AuthProvider");return value;}
