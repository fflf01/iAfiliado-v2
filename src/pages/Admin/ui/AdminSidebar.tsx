import { Link } from "react-router-dom";
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
          fixed top-0 left-0 h-full z-50 bg-card border-r border-border/50 flex flex-col transition-transform duration-300
          w-64
          ${props.isMobile ? (props.open ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          lg:sticky lg:top-0
        `}
      >
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/iAfiliado.png" alt="iAfiliado" className="h-11 w-auto" />
          </Link>
          {props.isMobile && (
            <button
              onClick={props.onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-b border-border/50 space-y-2">
          <span className="inline-flex text-xs font-semibold uppercase px-3 py-1 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
            Painel Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {props.items.map((item) => (
            <button
              key={item.id}
              onClick={() => props.onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                props.activeTab === item.id
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="ml-auto text-xs font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

