import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, MobileTabBar, MobileTopBar, SIDEBAR_COLLAPSE_KEY } from "@/components/app-sidebar";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const immersive = pathname.startsWith("/practice/");
  const [collapsed] = usePersistentToggle(SIDEBAR_COLLAPSE_KEY, false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {!immersive && <MobileTopBar />}
      <main
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64",
          !immersive && "pb-24 lg:pb-0",
        )}
      >
        <Outlet />
      </main>
      {!immersive && <MobileTabBar />}
    </div>
  );
}
