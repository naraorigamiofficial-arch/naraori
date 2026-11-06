"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="order-form" style={{ maxWidth: "26rem" }}>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required aria-invalid={state?.error ? true : undefined} aria-describedby={state?.error ? "login-err" : undefined} />
      </div>
      {state?.error && <p id="login-err" className="field-error" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  );
}
