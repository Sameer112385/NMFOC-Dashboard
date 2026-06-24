import { cn } from '@/lib/utils';

function LoadingCard({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-3xl border border-line/70 bg-panel/80', className)} />;
}

export default function AppLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-line/70 pb-6">
        <LoadingCard className="h-4 w-36" />
        <LoadingCard className="h-10 w-80" />
        <LoadingCard className="h-4 w-[32rem] max-w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <LoadingCard key={index} className="h-32" />
        ))}
      </div>

      <LoadingCard className="h-[480px] w-full" />
      <div className="grid gap-4 xl:grid-cols-2">
        <LoadingCard className="h-80" />
        <LoadingCard className="h-80" />
      </div>
    </div>
  );
}
