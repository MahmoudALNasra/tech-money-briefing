"use client";

import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";

import { ChevronDownIcon } from "@/components/business-data/ChevronDownIcon";
import {
  leadsFieldTriggerClassName,
  leadsPopoverPanelClassName
} from "@/components/business-data/leads-field-styles";

type RadiusOption = {
  miles: number;
  meters: number;
  label: string;
};

type LeadsRadiusSelectProps = {
  value: number;
  options: RadiusOption[];
  hasSubscriberAccess: boolean;
  freeRadiusLimitMeters: number;
  onChange: (meters: number) => void;
};

export function LeadsRadiusSelect({
  value,
  options,
  hasSubscriberAccess,
  freeRadiusLimitMeters,
  onChange
}: LeadsRadiusSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((item) => item.meters === value) ?? options[0];

  const handleSelect = (meters: number) => {
    onChange(meters);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        aria-label="Search radius"
        className={`${leadsFieldTriggerClassName} flex items-center justify-between gap-3 text-left`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={`${leadsPopoverPanelClassName} w-[var(--radix-popover-trigger-width)] p-2`}
          sideOffset={8}
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <ul className="max-h-80 space-y-1 overflow-auto">
            {options.map((item) => {
              const subscriberOnly =
                item.meters > freeRadiusLimitMeters && !hasSubscriberAccess;
              const isSelected = item.meters === value;

              return (
                <li key={item.meters}>
                  <button
                    type="button"
                    disabled={subscriberOnly}
                    onClick={() => handleSelect(item.meters)}
                    className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-emerald-50 font-semibold text-emerald-950"
                        : "text-stone-900 hover:bg-stone-100"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {item.label}
                    {subscriberOnly ? " - subscribers" : ""}
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
