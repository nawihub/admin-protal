"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A searchable select with the same API as the Radix one it replaces:
 *
 *   <Select value onValueChange>
 *     <SelectTrigger><SelectValue placeholder="…" /></SelectTrigger>
 *     <SelectContent>{options.map((o) => <SelectItem key value>{label}</SelectItem>)}</SelectContent>
 *   </Select>
 *
 * Options are read from SelectContent's children (SelectItems, optionally inside fragments or
 * SelectGroups), so the closed trigger can show the selected label without mounting the list.
 * Long lists get a search box (on by default past SEARCH_THRESHOLD options) and always-visible
 * scrollbars.
 */

const SEARCH_THRESHOLD = 6;

interface Option {
  value: string;
  label: React.ReactNode;
  text: string;
  disabled?: boolean;
}

interface SelectContextValue {
  value: string;
  options: Option[];
  selected: Option | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  choose: (value: string) => void;
  disabled?: boolean;
  listId: string;
  searchable: boolean;
  searchPlaceholder?: string;
  contentClassName?: string;
  query: string;
  setQuery: (query: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select parts must be used inside <Select>");
  return ctx;
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Flattens fragments, arrays and groups into the SelectItems they contain. */
function collectOptions(children: React.ReactNode, into: Option[] = []): Option[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode; value?: string; disabled?: boolean }>(child)) return;
    if (child.type === SelectItem) {
      into.push({ value: String(child.props.value), label: child.props.children, text: textOf(child.props.children), disabled: child.props.disabled });
    } else {
      collectOptions(child.props.children, into);
    }
  });
  return into;
}

function findContent(children: React.ReactNode): React.ReactElement<SelectContentProps> | undefined {
  let found: React.ReactElement<SelectContentProps> | undefined;
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement<{ children?: React.ReactNode }>(child)) return;
    if (child.type === SelectContent) found = child as React.ReactElement<SelectContentProps>;
    else found = findContent(child.props.children);
  });
  return found;
}

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Select({ value: controlled, defaultValue = "", onValueChange, disabled, open: openProp, onOpenChange, children }: SelectProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const [query, setQuery] = React.useState("");
  const listId = React.useId();

  const content = findContent(children);
  const contentChildren = content?.props.children;
  const options = React.useMemo(() => collectOptions(contentChildren), [contentChildren]);
  const searchable = content?.props.searchable ?? options.length > SEARCH_THRESHOLD;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      if (!next) setQuery("");
      setOpenState(next);
      onOpenChange?.(next);
    },
    [disabled, onOpenChange],
  );

  const choose = React.useCallback(
    (next: string) => {
      if (controlled === undefined) setUncontrolled(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [controlled, onValueChange, setOpen],
  );

  const ctx: SelectContextValue = {
    value, options, selected: options.find((o) => o.value === value), open, setOpen, choose, disabled, listId,
    searchable, searchPlaceholder: content?.props.searchPlaceholder, contentClassName: content?.props.className,
    query, setQuery,
  };

  return (
    <SelectContext.Provider value={ctx}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </PopoverPrimitive.Root>
    </SelectContext.Provider>
  );
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { open, setOpen, disabled, listId, searchable, setQuery } = useSelect();
    return (
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
            } else if (searchable && !open && e.key.length === 1 && e.key !== " " && !e.metaKey && !e.ctrlKey && !e.altKey) {
              // Start typing on the closed trigger to open it and search.
              e.preventDefault();
              setOpen(true);
              setQuery(e.key);
            }
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors",
            "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/10",
            "disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary-500 [&>span]:line-clamp-1",
            className,
          )}
          {...props}
        >
          {children}
          <ChevronDown className={cn("size-4 shrink-0 opacity-60 transition-transform duration-normal", open && "rotate-180")} aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

/** Shows the selected option's label (or the placeholder); pass children to render something else. */
function SelectValue({ placeholder, className, children }: { placeholder?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  const { selected } = useSelect();
  return (
    <span className={cn("truncate", !selected && children === undefined && "text-muted-foreground", className)}>
      {children ?? (selected ? selected.label : placeholder)}
    </span>
  );
}

interface SelectContentProps {
  className?: string;
  children?: React.ReactNode;
  /** Show the search box; defaults to on for lists longer than SEARCH_THRESHOLD options. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Accepted for API compatibility; the list always drops below (or above) the trigger. */
  position?: "popper" | "item-aligned";
}

/**
 * Carries the options and settings (Select reads its props) and renders the open list. Must be a
 * child of Select, as with the Radix API.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- props are read by Select
function SelectContent(_props: SelectContentProps) {
  return <SelectPanel />;
}

function SelectPanel() {
  const { options, value, choose, open, setOpen, listId, searchable, searchPlaceholder, contentClassName, query, setQuery } = useSelect();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = normalize(query.trim());
    return q ? options.filter((o) => normalize(o.text).includes(q)) : options;
  }, [options, query]);

  const selectedIndex = filtered.findIndex((o) => o.value === value);
  const [activeState, setActive] = React.useState<{ query: string; index: number } | null>(null);
  // The highlight follows the query: a new search starts at the first match; opening starts at
  // the selected option.
  const active = activeState && activeState.query === query ? activeState.index : query ? 0 : Math.max(selectedIndex, 0);
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const move = (index: number) => {
    if (!filtered.length) return;
    const next = (index + filtered.length) % filtered.length;
    setActive({ query, index: next });
    requestAnimationFrame(() => document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" }));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); move(active + 1); break;
      case "ArrowUp": e.preventDefault(); move(active - 1); break;
      case "Home": if (!searchable) { e.preventDefault(); move(0); } break;
      case "End": if (!searchable) { e.preventDefault(); move(filtered.length - 1); } break;
      case "Enter": {
        e.preventDefault();
        const option = filtered[active];
        if (option && !option.disabled) choose(option.value);
        break;
      }
      case "Tab": setOpen(false); break;
    }
  };

  if (!open) return null;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={6}
        collisionPadding={12}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (inputRef.current ?? listRef.current)?.focus();
          if (selectedIndex > 0) requestAnimationFrame(() => document.getElementById(optionId(selectedIndex))?.scrollIntoView({ block: "center" }));
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "z-popover flex min-w-[var(--radix-popover-trigger-width)] max-w-[min(28rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-scale-in",
          contentClassName,
        )}
      >
        {searchable && (
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder ?? "Search…"}
              aria-label="Search options"
              aria-controls={listId}
              aria-activedescendant={filtered[active] ? optionId(active) : undefined}
              className="h-10 w-full border-0 bg-transparent text-sm shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            />
          </div>
        )}
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={searchable ? -1 : 0}
          aria-activedescendant={!searchable && filtered[active] ? optionId(active) : undefined}
          className="select-scroll max-h-72 overflow-y-auto overscroll-contain p-1.5 outline-none"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
          ) : (
            filtered.map((option, i) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  data-active={i === active || undefined}
                  onPointerMove={() => i !== active && setActive({ query, index: i })}
                  // Keep focus in the search box while clicking an option.
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => !option.disabled && choose(option.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors",
                    "data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800",
                    isSelected && "font-medium text-primary-700 dark:text-primary-300",
                    option.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <span className="absolute left-2.5 flex size-4 items-center justify-center">
                    {isSelected && <Check className="size-4" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

/** An option; SelectContent lists it (on its own it renders nothing). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- props are read by Select
function SelectItem(_props: { value: string; disabled?: boolean; className?: string; children?: React.ReactNode }) {
  return null;
}

/** Groups options; purely structural - their options are listed in order. */
function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export { Select, SelectValue, SelectGroup, SelectTrigger, SelectContent, SelectItem };
