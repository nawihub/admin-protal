"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/http";

/**
 * A moderation action: runs `fn`, toasts the outcome, and refreshes everything it can have
 * changed - the area's lists and details, the queue counts and the dashboard.
 */
export function useAction<TArgs = void, TResult = unknown>(
  fn: (args: TArgs) => Promise<TResult>,
  { success, invalidate }: { success: string | ((result: TResult) => string); invalidate: readonly (readonly unknown[])[] },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      toast.success(typeof success === "function" ? success(result) : success);
      await Promise.all([
        ...invalidate.map((key) => queryClient.invalidateQueries({ queryKey: key })),
        queryClient.invalidateQueries({ queryKey: ["counts"] }),
        queryClient.invalidateQueries({ queryKey: ["attention"] }),
        queryClient.invalidateQueries({ queryKey: ["audit"] }),
      ]);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to do that."
          : err instanceof Error ? err.message : "Something went wrong",
      );
    },
  });
}
