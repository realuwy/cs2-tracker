export default function DemoNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-sm text-neutral-300 ${className}`}>
      This is a starter template with demo data. We’ll wire live inventory import and Skinport pricing in the next step.
    </div>
  );
}
