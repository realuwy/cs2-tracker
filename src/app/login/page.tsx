export const dynamic = "force-dynamic";
import AuthPanel from "@/components/AuthPanel";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">Sign up / Sign in</h2>
        <p className="mt-1 text-sm text-muted">
          You can also continue as guest — your data stays in your browser and later syncs to your account.
        </p>
      </div>
      <AuthPanel />
    </div>
  );
}
