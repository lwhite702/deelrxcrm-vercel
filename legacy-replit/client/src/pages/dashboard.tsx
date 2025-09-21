import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipHelp } from "@/components/ui/tooltip-help";
import { ChartLoading, ChartEmpty, ChartError, LoadingButton } from "@/components/ui/chart-states";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useTenant } from "@/contexts/tenant-context";
import { useLocation } from "@/lib/router";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, AlertTriangle, Clock, BarChart3, PieChart as PieChartIcon, Brain, Lightbulb, Target, Zap, PackageOpen, Settings2, CreditCard, Truck } from "lucide-react";
import { getContent } from "@/lib/content";


// TypeScript Types for Analytics Data
interface LLMInsight {
  id: string;
  type: 'pricing' | 'credit' | 'data' | 'training';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  suggestedAction: string;
  createdAt: string;
}

interface DashboardKPIs {
  todayRevenue: string;
  ordersToday: number;
  lowStockItems: number;
  overdueCredits: string;
}

interface RevenueTrend {
  period: string;
  revenue: string;
  orders: number;
  avgOrderValue: string;
  change: number;
}

interface PopularProduct {
  productId: string;
  name: string;
  totalSold: number;
  revenue: string;
}

interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: string;
  popularProducts: PopularProduct[];
  ordersByHour: Array<{
    hour: number;
    count: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    revenue: string;
  }>;
}

interface TopProduct {
  productId: string;
  name: string;
  currentStock: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  turnoverRate: number;
}

interface InventoryAnalytics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: string;
  topProducts: TopProduct[];
  stockLevels: Array<{
    category: string;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }>;
}

interface TopCustomer {
  customerId: string;
  name: string;
  totalOrders: number;
  totalSpent: string;
  lastOrderDate: Date | null;
}

interface CustomerInsights {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  customerGrowthRate: number;
  loyaltyBreakdown: Array<{
    tier: string;
    count: number;
    totalPoints: number;
  }>;
  creditSummary: {
    totalCreditLimit: string;
    totalCreditUsed: string;
    overdueAmount: string;
    overdueCustomers: number;
  };
  topCustomers: TopCustomer[];
}

// Chart color configuration with CSS custom property theming
const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "hsl(var(--chart-1))",
      dark: "hsl(var(--chart-1))"
    }
  },
  orders: {
    label: "Orders", 
    theme: {
      light: "hsl(var(--chart-2))",
      dark: "hsl(var(--chart-2))"
    }
  },
  customers: {
    label: "Customers",
    theme: {
      light: "hsl(var(--chart-3))",
      dark: "hsl(var(--chart-3))"
    }
  },
  inventory: {
    label: "Inventory",
    theme: {
      light: "hsl(var(--chart-4))",
      dark: "hsl(var(--chart-4))"
    }
  },
};

// Dynamic COLORS array using CSS custom properties for proper theming
const COLORS = [
  'hsl(var(--chart-1))', // Primary blue/teal
  'hsl(var(--chart-2))', // Success green  
  'hsl(var(--chart-3))', // Warning orange
  'hsl(var(--chart-4))', // Accent pink
  'hsl(var(--chart-5))', // Warning yellow
  'hsl(var(--primary))',  // Brand primary
];

export default function Dashboard() {
  const { currentTenant } = useTenant();
  const [, setLocation] = useLocation();
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [revenueDays, setRevenueDays] = useState('30');

  // Data queries
  const { data: kpis, isLoading: kpisLoading } = useQuery<DashboardKPIs>({
    queryKey: ["/api/tenants", currentTenant, "dashboard", "kpis"],
    enabled: !!currentTenant,
  });

  const { data: revenueTrends, isLoading: trendsLoading, isError: trendsError, refetch: refetchTrends } = useQuery<RevenueTrend[]>({
    queryKey: ["/api/tenants", currentTenant, "dashboard", "revenue-trends", revenuePeriod, revenueDays],
    queryFn: () => fetch(`/api/tenants/${currentTenant}/dashboard/revenue-trends?period=${revenuePeriod}&days=${revenueDays}`).then(res => res.json()),
    enabled: !!currentTenant,
  });

  const { data: orderAnalytics, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useQuery<OrderAnalytics>({
    queryKey: ["/api/tenants", currentTenant, "dashboard", "order-analytics"],
    enabled: !!currentTenant,
  });

  const { data: inventoryAnalytics, isLoading: inventoryLoading, isError: inventoryError, refetch: refetchInventory } = useQuery<InventoryAnalytics>({
    queryKey: ["/api/tenants", currentTenant, "dashboard", "inventory-analytics"],
    enabled: !!currentTenant,
  });

  const { data: customerInsights, isLoading: customersLoading, isError: customersError, refetch: refetchCustomers } = useQuery<CustomerInsights>({
    queryKey: ["/api/tenants", currentTenant, "dashboard", "customer-insights"],
    enabled: !!currentTenant,
  });

  // Individual loading states will be handled per-component for better UX

  // Transform data for charts
  const revenueChartData = revenueTrends?.map(trend => ({
    date: new Date(trend.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(trend.revenue),
    orders: trend.orders,
    avgOrder: parseFloat(trend.avgOrderValue),
  })) || [];

  const orderHourData = orderAnalytics?.ordersByHour?.map(hour => ({
    hour: `${hour.hour}:00`,
    orders: hour.count,
  })) || [];

  const paymentMethodData = orderAnalytics?.paymentMethodBreakdown?.map(method => ({
    name: method.method || 'Cash',
    value: method.count,
    revenue: parseFloat(method.revenue || '0'),
  })) || [];

  const loyaltyData = customerInsights?.loyaltyBreakdown?.map(tier => ({
    name: tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1),
    value: tier.count,
    points: tier.totalPoints,
  })) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/30" data-testid="page-dashboard">
      {/* Skip Navigation Links */}
      <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
        <a href="#quick-actions" className="bg-primary text-primary-foreground px-4 py-2 rounded focus-ring">
          {getContent('dashboard.skip_links.quick_actions')}
        </a>
        <a href="#kpi-section" className="bg-primary text-primary-foreground px-4 py-2 rounded focus-ring ml-2">
          {getContent('dashboard.skip_links.kpis')}  
        </a>
        <a href="#analytics-section" className="bg-primary text-primary-foreground px-4 py-2 rounded focus-ring ml-2">
          {getContent('dashboard.skip_links.analytics')}
        </a>
      </div>

      <header className="mb-8 glass-strong rounded-xl p-6 neon-glow">
        <div className="flex items-center justify-between">
          <div>
            <TooltipHelp content={getContent('dashboard.header_tooltip')}>
              <h1 className="text-3xl font-bold text-heading">{getContent('dashboard.title')}</h1>
            </TooltipHelp>
            <p className="mt-1 text-sm text-body">{getContent('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={revenuePeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setRevenuePeriod(value)}>
              <SelectTrigger className="w-32" data-testid="select-period">
                <SelectValue placeholder={getContent('dashboard.controls.period_label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{getContent('dashboard.controls.daily')}</SelectItem>
                <SelectItem value="weekly">{getContent('dashboard.controls.weekly')}</SelectItem>
                <SelectItem value="monthly">{getContent('dashboard.controls.monthly')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={revenueDays} onValueChange={setRevenueDays}>
              <SelectTrigger className="w-24" data-testid="select-days">
                <SelectValue placeholder={getContent('dashboard.controls.days_label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{getContent('dashboard.controls.days_7')}</SelectItem>
                <SelectItem value="30">{getContent('dashboard.controls.days_30')}</SelectItem>
                <SelectItem value="90">{getContent('dashboard.controls.days_90')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* AI Intelligence Section */}
      <section aria-labelledby="ai-intelligence-heading" className="mb-8">
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle id="ai-intelligence-heading" className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Brain className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{getContent('dashboard.ai_section.title')}</h2>
              <TooltipHelp content={getContent('dashboard.tooltips.ai_section')}>
                <span className="sr-only">Help</span>
              </TooltipHelp>
            </CardTitle>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights" data-testid="tab-insights">
                <Lightbulb className="h-4 w-4 mr-1" />
                {getContent('dashboard.tabs.insights')}
              </TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">
                <Target className="h-4 w-4 mr-1" />
                {getContent('dashboard.tabs.pricing')}
              </TabsTrigger>
              <TabsTrigger value="credit" data-testid="tab-credit">
                <DollarSign className="h-4 w-4 mr-1" />
                {getContent('dashboard.tabs.credit')}
              </TabsTrigger>
              <TabsTrigger value="training" data-testid="tab-training">
                <Zap className="h-4 w-4 mr-1" />
                {getContent('dashboard.tabs.training')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{getContent('dashboard.intelligence.smart_pricing.title')}</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">3</p>
                    <p className="text-xs text-muted-foreground">{getContent('dashboard.intelligence.smart_pricing.pending_msg')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{getContent('dashboard.intelligence.credit_insights.title')}</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">7</p>
                    <p className="text-xs text-muted-foreground">{getContent('dashboard.intelligence.credit_insights.available_msg')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">{getContent('dashboard.intelligence.data_quality.title')}</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">92%</p>
                    <p className="text-xs text-muted-foreground">{getContent('dashboard.intelligence.data_quality.accuracy_msg')}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{getContent('dashboard.intelligence.recent_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{getContent('dashboard.intelligence.smart_pricing.opportunity_title')}</p>
                      <p className="text-xs text-muted-foreground">{getContent('dashboard.intelligence.smart_pricing.opportunity_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <AlertTriangle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{getContent('dashboard.intelligence.credit_insights.alert_title')}</p>
                      <p className="text-xs text-muted-foreground">{getContent('dashboard.intelligence.credit_insights.alert_desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-4">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">{getContent('dashboard.intelligence.smart_pricing.intelligence_title')}</h3>
                <p className="text-sm text-muted-foreground mt-2">{getContent('dashboard.intelligence.pricing_coming.status')}</p>
                <p className="text-xs text-muted-foreground mt-1">{getContent('dashboard.intelligence.pricing_coming.description')}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="credit" className="space-y-4">
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">{getContent('dashboard.intelligence.credit_insights.intelligence_title')}</h3>
                <p className="text-sm text-muted-foreground mt-2">{getContent('dashboard.intelligence.credit_coming.status')}</p>
                <p className="text-xs text-muted-foreground mt-1">{getContent('dashboard.intelligence.credit_coming.description')}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="training" className="space-y-4">
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">{getContent('dashboard.intelligence.training_agent.title')}</h3>
                <p className="text-sm text-muted-foreground mt-2">{getContent('dashboard.intelligence.training_agent.status')}</p>
                <p className="text-xs text-muted-foreground mt-1">{getContent('dashboard.intelligence.training_agent.description')}</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>
      </section>

      {/* Quick Access Actions */}
      <section aria-labelledby="quick-actions-heading" className="mb-8" id="quick-actions">
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/30 via-purple-50/30 to-blue-50/30 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle id="quick-actions-heading" className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Zap className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{getContent('dashboard.quick_actions.title')}</h2>
              <TooltipHelp content={getContent('dashboard.tooltips.quick_actions')}>
                <span className="sr-only">Help</span>
              </TooltipHelp>
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <LoadingButton 
              className="h-24 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 focus-ring group btn-optimistic"
              data-testid="button-receive-inventory"
              tabIndex={0}
              accessKey="r"
              title={getContent('quick_access.titles.receive_inventory')}
              onClick={() => setLocation('/inventory')}
            >
              <div className="flex flex-col items-center gap-2">
                <PackageOpen className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {getContent('quick_access.receive_inventory')}
                </span>
              </div>
            </LoadingButton>

            <LoadingButton 
              className="h-24 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 focus-ring group btn-optimistic"
              data-testid="button-adjust-inventory"
              tabIndex={0}
              accessKey="a"
              title={getContent('quick_access.titles.adjust_inventory')}
              onClick={() => setLocation('/inventory')}
            >
              <div className="flex flex-col items-center gap-2">
                <Settings2 className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {getContent('quick_access.adjust_inventory')}
                </span>
              </div>
            </LoadingButton>

            <LoadingButton 
              className="h-24 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 focus-ring group btn-optimistic"
              data-testid="button-customer-checkout"
              tabIndex={0}
              accessKey="c"
              title={getContent('quick_access.titles.checkout')}
              onClick={() => setLocation('/sales-pos')}
            >
              <div className="flex flex-col items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200 text-center">
                  {getContent('quick_access.checkout')}
                </span>
              </div>
            </LoadingButton>

            <LoadingButton 
              className="h-24 p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 focus-ring group btn-optimistic"
              data-testid="button-credit-payment"
              tabIndex={0}
              accessKey="p"
              title={getContent('quick_access.titles.credit_payment')}
              onClick={() => setLocation('/credit')}
            >
              <div className="flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200 text-center">
                  {getContent('quick_access.credit_payment')}
                </span>
              </div>
            </LoadingButton>
          </div>
        </CardContent>
        </Card>
      </section>

      {/* Enhanced KPI Cards */}
      <section aria-labelledby="kpi-heading" className="mb-8" id="kpi-section">
        <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards" role="region" aria-label="Key Performance Indicators">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <TooltipHelp content={getContent('dashboard.tooltips.revenue_tooltip')} side="top">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{getContent('dashboard.kpis.today_revenue')}</p>
                </TooltipHelp>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-revenue-today">
                  ${kpis?.todayRevenue || "0"}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+12.5% vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <TooltipHelp content={getContent('dashboard.tooltips.orders_tooltip')} side="top">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{getContent('dashboard.kpis.orders_today')}</p>
                </TooltipHelp>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-orders-today">
                  {kpis?.ordersToday || 0}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600">+8.2% vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <TooltipHelp content="Products below minimum stock threshold requiring attention." side="top">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Low Stock Items</p>
                </TooltipHelp>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100" data-testid="text-low-stock">
                  {kpis?.lowStockItems || 0}
                </p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
                  <span className="text-sm text-yellow-600">Needs attention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <TooltipHelp content="Total active customers and growth metrics." side="top">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Customers</p>
                </TooltipHelp>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-active-customers">
                  {customerInsights?.activeCustomers || 0}
                </p>
                <div className="flex items-center mt-2">
                  {(customerInsights?.customerGrowthRate || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-purple-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-purple-600 mr-1" />
                  )}
                  <span className="text-sm text-purple-600">
                    {customerInsights?.customerGrowthRate?.toFixed(1) || 0}% growth
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </section>

      {/* Analytics Charts */}
      <section aria-labelledby="analytics-heading" id="analytics-section">
        <h2 id="analytics-heading" className="sr-only">Business Analytics Charts</h2>
        <Tabs defaultValue="revenue" className="space-y-6" role="tablist" aria-label="Analytics charts">
        <TabsList className="grid w-full grid-cols-4 glass neon-glow">
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            <BarChart3 className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="w-4 h-4 mr-2" />
            Customers
          </TabsTrigger>
        </TabsList>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/* Revenue Trends Chart with Enhanced States */}
            {trendsLoading ? (
              <div className="lg:col-span-2">
                <ChartLoading title={getContent("charts.revenue_trends")} />
              </div>
            ) : trendsError ? (
              <div className="lg:col-span-2">
                <ChartError 
                  title={getContent("charts.revenue_trends")}
                  message="Failed to load revenue trends data."
                  onRetry={() => refetchTrends()}
                />
              </div>
            ) : !revenueChartData?.length ? (
              <div className="lg:col-span-2">
                <ChartEmpty 
                  title={getContent("charts.revenue_trends")}
                  message="No revenue data available for the selected period."
                  actionLabel="View All Time"
                  onAction={() => setRevenueDays('365')}
                />
              </div>
            ) : (
              <Card className="lg:col-span-2 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl chart-container">
                <CardHeader>
                  <CardTitle className="text-heading">Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80 chart-container">
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="urban-text-glow">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Average Order Value</span>
                    <span className="font-medium">${orderAnalytics?.averageOrderValue || '0'}</span>
                  </div>
                  <Progress value={75} className="mt-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Completed Orders</span>
                    <span className="font-medium">{orderAnalytics?.completedOrders || 0}</span>
                  </div>
                  <Progress value={85} className="mt-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span className="font-medium">92.3%</span>
                  </div>
                  <Progress value={92} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Analytics Tab */}
        <TabsContent value="orders">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
{/* Orders by Hour Chart with Enhanced States */}
            {ordersLoading ? (
              <ChartLoading title={getContent("charts.orders_by_hour")} />
            ) : ordersError ? (
              <ChartError 
                title={getContent("charts.orders_by_hour")}
                message="Failed to load order analytics data."
                onRetry={() => refetchOrders()}
              />
            ) : !orderHourData?.length ? (
              <ChartEmpty 
                title={getContent("charts.orders_by_hour")}
                message="No hourly order data available."
                actionLabel="Refresh Data"
                onAction={() => window.location.reload()}
              />
            ) : (
              <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl chart-container">
                <CardHeader>
                  <CardTitle className="text-heading">Orders by Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80 chart-container">
                    <BarChart data={orderHourData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

{/* Payment Methods Chart with Enhanced States */}
            {ordersLoading ? (
              <ChartLoading title={getContent("charts.payment_methods")} />
            ) : ordersError ? (
              <ChartError 
                title={getContent("charts.payment_methods")}
                message="Failed to load payment method data."
                onRetry={() => refetchOrders()}
              />
            ) : !paymentMethodData?.length ? (
              <ChartEmpty 
                title={getContent("charts.payment_methods")}
                message="No payment method data available."
                actionLabel="View Orders"
                onAction={() => setLocation('/sales-pos')}
              />
            ) : (
              <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl chart-container">
                <CardHeader>
                  <CardTitle className="text-heading">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80 chart-container">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--chart-3))"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card className="lg:col-span-2 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-heading">Popular Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderAnalytics?.popularProducts?.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 rounded-lg border glass hover:neon-glow transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.totalSold} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${product.revenue}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Analytics Tab */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="urban-text-glow">Stock Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">In Stock</span>
                    <span className="text-sm text-green-600 font-medium">
                      {(inventoryAnalytics?.totalProducts || 0) - (inventoryAnalytics?.lowStockCount || 0) - (inventoryAnalytics?.outOfStockCount || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((inventoryAnalytics?.totalProducts || 0) - (inventoryAnalytics?.lowStockCount || 0) - (inventoryAnalytics?.outOfStockCount || 0)) / (inventoryAnalytics?.totalProducts || 1) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Low Stock</span>
                    <span className="text-sm text-yellow-600 font-medium">{inventoryAnalytics?.lowStockCount || 0}</span>
                  </div>
                  <Progress 
                    value={(inventoryAnalytics?.lowStockCount || 0) / (inventoryAnalytics?.totalProducts || 1) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Out of Stock</span>
                    <span className="text-sm text-red-600 font-medium">{inventoryAnalytics?.outOfStockCount || 0}</span>
                  </div>
                  <Progress 
                    value={(inventoryAnalytics?.outOfStockCount || 0) / (inventoryAnalytics?.totalProducts || 1) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold">${inventoryAnalytics?.totalValue || '0'}</p>
                    <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

{/* Stock by Category Chart with Enhanced States */}
            {inventoryLoading ? (
              <ChartLoading title={getContent("charts.stock_by_category")} />
            ) : inventoryError ? (
              <ChartError 
                title={getContent("charts.stock_by_category")}
                message="Failed to load inventory analytics data."
                onRetry={() => refetchInventory()}
              />
            ) : !inventoryAnalytics?.stockLevels?.length ? (
              <ChartEmpty 
                title={getContent("charts.stock_by_category")}
                message="No inventory category data available."
                actionLabel="View Inventory"
                onAction={() => setLocation('/inventory')}
              />
            ) : (
              <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl chart-container">
                <CardHeader>
                  <CardTitle className="text-heading">Stock by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80 chart-container">
                    <BarChart data={inventoryAnalytics?.stockLevels || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="inStock" fill="hsl(var(--chart-1))" name="In Stock" />
                      <Bar dataKey="lowStock" fill="hsl(var(--chart-4))" name="Low Stock" />
                      <Bar dataKey="outOfStock" fill="hsl(var(--chart-5))" name="Out of Stock" />
                      <Legend />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card className="lg:col-span-2 glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-heading">Top Products by Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryAnalytics?.topProducts?.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 rounded-lg border glass hover:neon-glow transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          product.stockStatus === 'in_stock' ? 'bg-green-500' :
                          product.stockStatus === 'low_stock' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Turnover: {product.turnoverRate}x</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{product.currentStock} units</p>
                        <p className={`text-sm ${
                          product.stockStatus === 'in_stock' ? 'text-green-600' :
                          product.stockStatus === 'low_stock' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.stockStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Analytics Tab */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-heading">Customer Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{customerInsights?.totalCustomers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Customers</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{customerInsights?.newCustomersThisMonth || 0}</p>
                      <p className="text-sm text-muted-foreground">New This Month</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Customer Retention</span>
                        <span className="font-medium">89.2%</span>
                      </div>
                      <Progress value={89} className="mt-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Active Customers</span>
                        <span className="font-medium">{((customerInsights?.activeCustomers || 0) / (customerInsights?.totalCustomers || 1) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(customerInsights?.activeCustomers || 0) / (customerInsights?.totalCustomers || 1) * 100} className="mt-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

{/* Loyalty Tiers Chart with Enhanced States */}
            {customersLoading ? (
              <ChartLoading title={getContent("charts.loyalty_tiers")} />
            ) : customersError ? (
              <ChartError 
                title={getContent("charts.loyalty_tiers")}
                message="Failed to load customer insights data."
                onRetry={() => refetchCustomers()}
              />
            ) : !loyaltyData?.length ? (
              <ChartEmpty 
                title={getContent("charts.loyalty_tiers")}
                message="No customer loyalty data available."
                actionLabel="View Loyalty"
                onAction={() => setLocation('/loyalty')}
              />
            ) : (
              <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl chart-container">
                <CardHeader>
                  <CardTitle className="text-heading">Loyalty Tiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80 chart-container">
                    <PieChart>
                      <Pie
                        data={loyaltyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="hsl(var(--chart-3))"
                        dataKey="value"
                      >
                        {loyaltyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-heading">Credit Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Credit Limit</span>
                    <span className="font-medium">${customerInsights?.creditSummary.totalCreditLimit || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Credit Used</span>
                    <span className="font-medium">${customerInsights?.creditSummary.totalCreditUsed || '0'}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Overdue Amount</span>
                    <span className="font-medium">${customerInsights?.creditSummary.overdueAmount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Overdue Customers</span>
                    <span className="font-medium">{customerInsights?.creditSummary.overdueCustomers || 0}</span>
                  </div>
                  
                  <Progress 
                    value={(parseFloat(customerInsights?.creditSummary.totalCreditUsed || '0') / parseFloat(customerInsights?.creditSummary.totalCreditLimit || '1')) * 100} 
                    className="mt-4" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass urban-card hover:neon-glow group transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-heading">Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerInsights?.topCustomers?.slice(0, 5).map((customer, index) => (
                    <div key={customer.customerId} className="flex items-center justify-between p-3 rounded-lg border glass hover:neon-glow transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.totalOrders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${customer.totalSpent}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'No orders'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </Tabs>
      </section>

    </div>
  );
}