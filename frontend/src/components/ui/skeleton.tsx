import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      // render as inline element but style as block to preserve layout
      className={cn("animate-pulse rounded-md bg-muted block", className)}
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
    />
  );
}

export { Skeleton };
