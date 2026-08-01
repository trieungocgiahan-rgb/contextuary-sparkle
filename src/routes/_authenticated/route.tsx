import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, MobileTabBar, MobileTopBar } from "@/components/app-sidebar";

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
  const immersive = pathname.startsWith("/practice");

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {!immersive && <MobileTopBar />}
      <main className={immersive ? "lg:pl-64" : "pb-24 lg:pb-0 lg:pl-64"}>
        <Outlet />
      </main>
      {!immersive && <MobileTabBar />}
    </div>
  );
}
