import { useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function App() {
 const [token, setToken] = useState<string | null>(null);
 const [userData, setUserData] = useState<{ fid: number} | null>(null);

 async function signIn() {
   try {
     const { token } = await sdk.quickAuth.getToken();
     setToken(token);
     
     // Use the token to authenticate the user and fetch authenticated user data
     const response = await sdk.quickAuth.fetch(`${BACKEND_ORIGIN}/auth`, {
       headers: { "Authorization": `Bearer ${token}` }
     });
     
     const data = await response.json();
     setUserData(data);
   } catch (error) {
     console.error("Authentication failed:", error);
   }
 }

 function signOut() {
   setToken(null);
   setUserData(null);
 }

 if (!token) {
   return <button onClick={signIn}>Sign In</button>;
 }

 return (
   <div>
     <p>Authenticated as FID: {userData?.fid}</p>
     <button onClick={signOut}>Sign Out</button>
   </div>
 );
}
