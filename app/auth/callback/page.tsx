"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Logo } from "@/components/ui";
export default function Callback() {
  const [error, setError] = useState("");
  useEffect(() => {
    const finish = async () => {
      if (!supabase) {
        setError("Supabase is not connected.");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get("error")) {
        setError(
          params.get("error_description") || "Google sign-in was cancelled.",
        );
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) setError(error.message);
      else if (data.session) window.location.replace("/");
      else setError("Sign-in could not finish. Return home and try again.");
    };
    void finish();
  }, []);
  return (
    <div className="auth-panel panel">
      <Logo size={90} />
      <h1>{error ? "Sign-in needs another try" : "Signing you in…"}</h1>
      <p role={error ? "alert" : "status"}>
        {error || "Getting your place in the league ready."}
      </p>
      {error && (
        <Link className="button" href="/">
          Return home
        </Link>
      )}
    </div>
  );
}
