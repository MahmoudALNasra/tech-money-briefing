"use client";

import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { useMemo, useState } from "react";

import { ChevronDownIcon } from "@/components/business-data/ChevronDownIcon";
import {
  leadsFieldTriggerClassName,
  leadsPopoverPanelClassName
} from "@/components/business-data/leads-field-styles";
import { BUSINESS_DATA_CATEGORIES } from "@/lib/business-data-categories";
import type { getGroupedCategoryOptions } from "@/lib/business-data-category-groups";

type CategoryGroup = ReturnType<typeof getGroupedCategoryOptions>[number];

type LeadsCategoryComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  groups: CategoryGroup[];
};

export function LeadsCategoryCombobox({
  value,
  onChange,
  groups
}: LeadsCategoryComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => BUSINESS_DATA_CATEGORIES.find((item) => item.value === value)?.label ?? value,
    [value]
  );

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        aria-label="Business category"
        className={`${leadsFieldTriggerClassName} flex items-center justify-between gap-3 text-left`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={`${leadsPopoverPanelClassName} w-[min(100vw-2rem,42rem)] max-w-none`}
          sideOffset={8}
          align="start"
          collisionPadding={16}
          data-surface="light"
        >
          <Command
            label="Search business categories"
            className="flex flex-col"
            loop
          >
            <div className="border-b border-stone-100 px-4 py-3">
              <Command.Input
                placeholder="Search categories..."
                className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-400"
              />
            </div>
            <Command.List className="max-h-[min(70vh,28rem)] overflow-auto p-3">
              <Command.Empty className="px-3 py-6 text-center text-xs font-semibold text-stone-500">
                No categories found.
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group.id}
                  heading={group.label}
                  className="mb-2 [&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-stone-100 [&_[cmdk-group-heading]]:bg-white [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-stone-800"
                >
                  <div className="grid gap-1 sm:grid-cols-2">
                    {group.options.map((item) => (
                      <Command.Item
                        key={item.value}
                        value={`${item.label} ${item.value}`}
                        onSelect={() => handleSelect(item.value)}
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-stone-900 outline-none data-[selected=true]:bg-emerald-50 data-[selected=true]:font-semibold data-[selected=true]:text-emerald-950 aria-selected:bg-stone-100"
                      >
                        {item.label}
                      </Command.Item>
                    ))}
                  </div>
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
