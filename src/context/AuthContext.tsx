import { isPreview, storageKeys } from "@/config/settings";
import React, {createContext,useContext,useState,useEffect,ReactNode,useCallback} from "react";
import {loginUser,registerUser,fetchCurrentUser} from "@/utils/api";
export interface User {id:string;name:string;email:string;avatar?:string;}
interface AuthContextType {user:User|null;isLoginModalOpen:boolean;openLoginModal:()=>void;closeLoginModal:()=>void;login:(user:User,token:string)=>void;register:(name:string,email:string,password:string)=>Promise<User>;logout:()=>void;isLoading:boolean;}
const AuthContext=createContext<AuthContextType|null>(null);
export const AuthProvider:React.FC<{children:ReactNode}>=({children})=>{
  const [user,setUser]=useState<User|null>(null);
  const [isLoginModalOpen,setModal]=useState(false);
  const [isLoading,setLoading]=useState(true);
  const forget=useCallback(()=>{
    try {localStorage.removeItem("auth-token");localStorage.removeItem("user-data");localStorage.removeItem("woo-session");} catch { /* Storage can be disabled. */ }
    setUser(null);
  },[]);
  useEffect(()=>{
    let active=true;
    const expired=()=>{forget();setModal(true);};
    window.addEventListener("chronos-auth-expired",expired);
    async function restore(){
      try {if(!isPreview && localStorage.getItem("auth-token")){const verified=await fetchCurrentUser();if(active)setUser(verified);}}
      catch {if(active)setUser(null);}
      finally {if(active)setLoading(false);}
    }
    void restore();
    return ()=>{active=false;window.removeEventListener("chronos-auth-expired",expired);};
  },[forget]);
  const login=(next:User,token:string)=>{
    localStorage.setItem("auth-token",token);
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
    forget();
    try {localStorage.removeItem(storageKeys.guestCart);} catch { /* In-memory state clears on navigation. */ }
    window.location.assign("/");
  };
  return <AuthContext.Provider value={{user,isLoginModalOpen,openLoginModal:()=>setModal(true),closeLoginModal:()=>setModal(false),login,register,logout,isLoading}}>{children}</AuthContext.Provider>;
};
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used within AuthProvider");return value;}
