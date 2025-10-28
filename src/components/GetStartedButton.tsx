"use client";

export default function GetStartedButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        window.dispatchEvent(new Event("auth:open")); // 🔥 opens sign-in modal
      }}
      className={[
        "inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-black hover:opacity-90 transition disabled:opacity-60",
        props.className || "",
      ].join(" ")}
    >
      Get Started
    </button>
  );
}

