"use client";

import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

export type Option = { value: string; label: string };

export default function ThemeSelect({
  value,
  onChange,
  options,
  disabled,
  className,
  buttonClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const current =
    options.find((o) => o.value === value) ?? options[0] ?? { value: "", label: "" };

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className ?? ""}`}>
        <Listbox.Button
          className={[
            // field (matches your theme)
            "h-12 w-full rounded-xl text-left text-sm text-zinc-200",
            "border border-[#2a2e44] bg-[#151726] px-3",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
            "disabled:opacity-50",
            buttonClassName ?? "",
          ].join(" ")}
        >
          {current.label}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true" className="opacity-70">
              <path
                d="M6 8l4 4 4-4"
                stroke="#a5b4fc"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl
                       border border-[#2a2e44] bg-[#0f1222] p-1 text-sm
                       shadow-xl ring-1 ring-black/5"
          >
            {options.map((opt) => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  [
                    "cursor-pointer select-none rounded-lg px-3 py-2",
                    active ? "bg-indigo-500/15 text-indigo-200" : "text-zinc-200 hover:bg-white/5",
                  ].join(" ")
                }
              >
                {opt.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
