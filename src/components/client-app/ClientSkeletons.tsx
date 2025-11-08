import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client App - Skeleton Loaders Personalizados
 * Optimizados para mobile-first y desktop
 */

// Dashboard Hero Card Skeleton
export function DashboardHeroSkeleton() {
  return (
    <Card className="border-0 overflow-hidden min-h-[200px] animate-fade-in">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24 mt-3" />
      </CardContent>
    </Card>
  );
}

// Dashboard Cards Grid Skeleton
export function DashboardCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Documents List Skeleton
export function DocumentsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="transition-opacity">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Photos Grid Skeleton (Mobile 2 cols)
export function PhotosGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Photos Grid Skeleton Desktop (4-6 cols)
export function PhotosGridSkeletonDesktop({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Financial Payment Card Skeleton
export function PaymentCardSkeleton() {
  return (
    <Card className="border-l-4 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// Appointments Calendar Skeleton
export function AppointmentsCalendarSkeleton() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Chat Messages Skeleton
export function ChatMessagesSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => {
        const isSelf = i % 3 === 0;
        return (
          <div
            key={i}
            className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] space-y-1`}>
              <Skeleton className={`h-16 ${isSelf ? 'w-48' : 'w-56'} rounded-2xl`} />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Settings Form Skeleton
export function SettingsFormSkeleton() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// Generic Loading State
export function ClientLoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="h-full flex items-center justify-center p-4 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Empty State Component
export function ClientEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4 animate-fade-in">
      <Icon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}
