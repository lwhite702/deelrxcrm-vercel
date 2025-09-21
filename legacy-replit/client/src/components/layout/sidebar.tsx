import { useState, useEffect } from "react";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart3, 
  Package, 
  Users, 
  CreditCard, 
  Truck, 
  Star, 
  DollarSign, 
  Settings, 
  HelpCircle, 
  Crown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart
} from "lucide-react";

interface SidebarProps {
  tenantId: string | null;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  flagKey?: string;
  tooltip: string;
}

const navItems: NavItem[] = [
  { 
    href: "/dashboard", 
    icon: BarChart3, 
    label: "Dashboard", 
    flagKey: "dashboard",
    tooltip: "View performance and metrics"
  },
  { 
    href: "/inventory", 
    icon: Package, 
    label: "Inventory", 
    flagKey: "inventory",
    tooltip: "Receive and adjust stock"
  },
  { 
    href: "/customers", 
    icon: Users, 
    label: "Customers", 
    flagKey: "customers",
    tooltip: "View and manage all customers"
  },
  { 
    href: "/sales", 
    icon: ShoppingCart, 
    label: "Sales POS", 
    flagKey: "sales",
    tooltip: "Track sales and payments"
  },
  { 
    href: "/delivery", 
    icon: Truck, 
    label: "Delivery", 
    flagKey: "delivery",
    tooltip: "Manage deliveries"
  },
  { 
    href: "/loyalty", 
    icon: Star, 
    label: "Loyalty", 
    flagKey: "loyalty",
    tooltip: "Customer loyalty programs"
  },
  { 
    href: "/credit", 
    icon: CreditCard, 
    label: "Credit", 
    flagKey: "credit",
    tooltip: "Manage financing, limits, and payments"
  },
  { 
    href: "/payments", 
    icon: DollarSign, 
    label: "Payments", 
    flagKey: "payments",
    tooltip: "Payment processing"
  },
];

const bottomNavItems = [
  { 
    href: "/settings", 
    icon: Settings, 
    label: "Settings",
    tooltip: "Manage your account and preferences"
  },
  { 
    href: "/help", 
    icon: HelpCircle, 
    label: "Help",
    tooltip: "Read articles and how-tos"
  },
  { 
    href: "/super-admin", 
    icon: Crown, 
    label: "Super Admin",
    tooltip: "Super admin controls"
  },
];

export default function Sidebar({ tenantId }: SidebarProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: featureFlags = {} } = useFeatureFlags(tenantId);

  // Persist sidebar state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    
    // Emit custom event for main layout to listen
    window.dispatchEvent(new CustomEvent('sidebar-toggle'));
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.flagKey) return true;
    return featureFlags[item.flagKey] === true;
  });

  const NavItemComponent = ({ item, isBottom = false }: { item: NavItem | any, isBottom?: boolean }) => {
    const IconComponent = item.icon;
    const isActive = location === item.href;
    
    const navLink = (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center rounded-md transition-all duration-200 focus-ring",
          isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2",
          isActive
            ? "bg-primary/10 text-primary neon-glow-accent"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-').replace(' pos', '')}`}
        aria-current={isActive ? "page" : undefined}
        aria-label={isCollapsed ? item.tooltip : item.label}
      >
        <IconComponent className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
        {!isCollapsed && (
          <span className="text-sm font-medium sidebar-content-fade">
            {item.label}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {navLink}
          </TooltipTrigger>
          <TooltipContent side="right" className="tooltip-bg">
            <p>{item.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return navLink;
  };

  return (
    <nav 
      className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-16 bg-elev-1 border-r border-border glass sidebar-transition",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )} 
      data-testid="sidebar-navigation"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex-1 flex flex-col min-h-0 pt-4 pb-4">
        {/* Collapse toggle button */}
        <div className={cn("px-3 mb-4", isCollapsed && "px-2")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className={cn(
                  "w-full focus-ring",
                  isCollapsed ? "px-2" : "justify-start"
                )}
                data-testid="button-toggle-sidebar"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span className="sidebar-content-fade">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="tooltip-bg">
              <p>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main navigation items */}
        <div className={cn("flex-1 space-y-1", isCollapsed ? "px-2" : "px-3")}>
          {filteredNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
        
        {/* Bottom navigation items */}
        <div className={cn("mt-6 border-t border-border pt-4 space-y-1", isCollapsed ? "px-2" : "px-3")}>
          {bottomNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} isBottom />
          ))}
        </div>
      </div>
    </nav>
  );
}
