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
        {/* Field / trigger */}
        <Listbox.Button
          className={[
            "h-12 w-full rounded-xl text-left text-sm text-zinc-200",
            // surface + border
            "border border-[#2a2e44] bg-[#151726]/95",
            // spacing
            "px-3",
            // interactivity
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
            "hover:bg-[#181b2c]/95",
            "disabled:opacity-50",
            // subtle inner shadow to look inset
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]",
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

        {/* Popover panel */}
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Listbox.Options
            className={[
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl",
              // softer / lighter surface with subtle blur
              "backdrop-blur-md bg-[#181b2c]/92",
              // border + inner ring for definition
              "border border-[#353a55] ring-1 ring-black/40",
              // outer drop shadow for lift
              "shadow-[0_10px_30px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.35)]",
              "p-1 text-sm",
            ].join(" ")}
          >
            {options.map((opt) => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                className={({ active, selected }) =>
                  [
                    "cursor-pointer select-none rounded-lg px-3 py-2",
                    selected ? "bg-indigo-500/20 text-indigo-200" : "text-zinc-200",
                    active && !selected ? "bg-white/7 text-indigo-100" : "",
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
