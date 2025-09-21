import { useEffect } from "react";
import { Link, useLocation } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { BrandMark } from "@/branding/BrandMark";
import { 
  BarChart3, 
  Package, 
  Users, 
  CreditCard, 
  Truck, 
  Star, 
  DollarSign, 
  Settings, 
  Crown,
  X,
  ShoppingCart,
  HelpCircle
} from "lucide-react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function MobileSidebar({ isOpen, onClose, tenantId }: MobileSidebarProps) {
  const [location] = useLocation();
  const { data: featureFlags = {} } = useFeatureFlags(tenantId);

  const filteredNavItems = navItems.filter(item => {
    if (!item.flagKey) return true;
    return featureFlags[item.flagKey] === true;
  });

  // Focus trap functionality
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        // Return focus to menu trigger
        const menuTrigger = document.querySelector('[data-testid="button-mobile-menu"]') as HTMLElement;
        menuTrigger?.focus();
      }
      
      // Robust focus trap - keep focus within sidebar
      if (e.key === 'Tab') {
        const sidebar = document.querySelector('[data-testid="mobile-sidebar-nav"]');
        if (!sidebar) return;
        
        const focusableElements = sidebar.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return; // Guard against empty list
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus close button reliably when opened (more accessible than first nav item)
    setTimeout(() => {
      const closeButton = document.querySelector('[data-testid="button-close-mobile-sidebar"]') as HTMLElement;
      closeButton?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const IconComponent = item.icon;
    const isActive = location === item.href;
    
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus-ring",
          isActive
            ? "bg-primary/10 text-primary neon-glow-accent"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        data-testid={`link-mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-').replace(' pos', '')}`}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.tooltip}
      >
        <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
        data-testid="overlay-mobile-sidebar"
        aria-hidden="true"
      />
      <nav 
        className="fixed left-0 top-0 bottom-0 flex flex-col w-64 bg-elev-1 border-r border-border glass"
        data-testid="mobile-sidebar-nav"
        role="navigation"
        aria-label="Mobile navigation menu"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <BrandMark 
            variant="icon" 
            size="sm" 
            showTagline={false}
            theme="auto"
            className="text-lg font-semibold text-foreground"
          />
          <Button 
            variant="ghost" 
            size="sm"
            className="p-2 focus-ring"
            onClick={onClose}
            data-testid="button-close-mobile-sidebar"
            aria-label="Close mobile navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
          
          <div className="pt-4 border-t border-border mt-6 space-y-1">
            {bottomNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
