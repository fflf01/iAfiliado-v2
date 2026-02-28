import { X } from "lucide-react";

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function AdminSidebar(props: {
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (id: string) => void;
  items: SidebarItem[];
}) {
  return (
    <>
      {props.isMobile && props.open && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={props.onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 w-64 shrink-0
          bg-card/50 border-r border-border/50
          ${props.isMobile ? (props.open ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          lg:sticky lg:top-0 lg:mt-2
        `}
      >
        {props.isMobile && (
          <div className="p-5 border-b border-border/50 flex items-center justify-end">
            <button
              onClick={props.onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <nav className="flex-1 flex flex-col gap-2 p-4 min-h-0">
          <div className="pb-3 mb-2 border-b border-border/50">
            <span className="inline-flex text-sm font-bold uppercase tracking-wide px-3 py-2 rounded-lg bg-destructive/20 text-destructive border border-destructive/30">
              Painel Admin
            </span>
          </div>
          {props.items.map((item) => {
            const isActive = props.activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => props.onSelectTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="text-xs font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

