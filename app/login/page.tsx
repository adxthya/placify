"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-bold">Sign in to Placify</h1>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
        >
          <Image
            src="/google-icon.png"
            alt="Google"
            className="w-5 h-5"
            width={30}
            height={30}
          />
          <span>Continue with Google</span>
        </button>
      </div>
    </main>
  );
}
