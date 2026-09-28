import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PASSWORD_RULES = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "Upper and lower case letters", test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const passwordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

/** Live checklist that ticks off each rule as the password satisfies it. */
export function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={cn("flex items-center gap-1.5 text-xs transition-colors", ok ? "text-success" : "text-muted-foreground")}>
            <span className={cn("flex size-4 items-center justify-center rounded-full border transition-all duration-normal ease-spring", ok ? "scale-110 border-success bg-success text-white" : "border-border")}>
              {ok && <Check className="size-3" />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
