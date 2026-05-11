"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mt-1">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 text-sm text-primary hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
