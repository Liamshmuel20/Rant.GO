
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Logo from "@/components/Logo";
import NotificationCenter from "@/components/NotificationCenter";
import {
  Home,
  Package,
  FileText,
  PlusCircle,
  User,
  LogOut,
  Truck,
  Clock,
  Mail,
  MessageSquare,
  Shield,
  Menu,
  CreditCard
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as UserEntity } from "@/api/entities";
import { RentalRequest } from "@/api/entities";
import { Contract } from "@/api/entities";

const navigationItems = [
  {
    title: "בית",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "הוספת מוצר",
    url: createPageUrl("AddProduct"),
    icon: PlusCircle,
  },
  {
    title: "ביצוע תשלום",
    url: createPageUrl("Payments"),
    icon: CreditCard,
    needsBadge: "payments" // identifier for badge logic
  },
  {
    title: "בקשות השכרה",
    url: createPageUrl("RentalRequests"),
    icon: Clock,
    needsBadge: "rental_requests"
  },
  {
    title: "סטטוס השכרות",
    url: createPageUrl("MyRentals"),
    icon: Truck,
  },
  {
    title: "השיחות שלי",
    url: createPageUrl("MyChats"),
    icon: MessageSquare,
  },
  {
    title: "קצת עלינו",
    url: createPageUrl("AboutUs"),
    icon: User,
  },
  {
    title: "צור קשר",
    url: createPageUrl("ContactUs"),
    icon: Mail,
  },
];

// Admin navigation items - only for admin users
const adminNavigationItems = [
  {
    title: "דף הבקרה",
    url: createPageUrl("AdminDashboard"),
    icon: Shield,
    needsBadge: "admin_approvals"
  },
  ...navigationItems
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [badgeCounts, setBadgeCounts] = React.useState({});

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
        // Redirect to complete profile if phone is missing
        if (!currentUser.phone && window.location.pathname !== createPageUrl('CompleteProfile')) {
          window.location.href = createPageUrl('CompleteProfile');
        }
      } catch (error) {
        console.log("User not logged in");
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Load badge counts when user is available
  React.useEffect(() => {
    if (user) {
      loadBadgeCounts();
      // Refresh badge counts every 30 seconds
      const interval = setInterval(loadBadgeCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadBadgeCounts = async () => {
    if (!user) return;

    try {
      const counts = {};

      // Check for pending payments (for tenants)
      const allRequests = await RentalRequest.list();
      const pendingPayments = allRequests.filter(
        r => r.tenant_email === user.email && r.status === 'אושר ממתין לתשלום'
      );
      counts.payments = pendingPayments.length;

      // Check for pending rental requests (for landlords)
      const pendingRentalRequests = allRequests.filter(
        r => r.landlord_email === user.email && r.status === 'ממתין לאישור'
      );
      counts.rental_requests = pendingRentalRequests.length;

      // Check for admin approvals (admin only)
      if (user.email === "liampo10806@gmail.com") {
        const adminApprovals = allRequests.filter(
          r => r.status === 'שולם ממתין לאישור מנהלת'
        );
        counts.admin_approvals = adminApprovals.length;
      }

      setBadgeCounts(counts);

    } catch (error) {
      console.error("Error loading badge counts:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await UserEntity.logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Check if user is admin
  const isAdmin = user?.email === "liampo10806@gmail.com";
  const menuItems = isAdmin ? adminNavigationItems : navigationItems;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="border-l border-orange-200 bg-white/95 backdrop-blur-sm" side="right">
            <SidebarHeader className="border-b border-orange-200 p-4 bg-gradient-to-r from-orange-500 to-orange-600">
              <div className="flex items-center justify-between">
                <Logo size="medium" showText={true} className="text-white" />
                {user && <NotificationCenter />}
              </div>
              {isAdmin && (
                <div className="mt-2 px-2 py-1 bg-red-500/20 rounded-md">
                  <span className="text-xs text-red-100 font-bold">מנהלת מערכת</span>
                </div>
              )}
            </SidebarHeader>

            {user && (
              <>
                <SidebarContent className="p-3">
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-orange-700 uppercase tracking-wider px-3 py-3">
                      תפריט ניווט
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {menuItems.map((item) => {
                          const badgeCount = item.needsBadge ? badgeCounts[item.needsBadge] || 0 : 0;
                          
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 rounded-xl mb-2 mx-1 ${
                                  location.pathname.startsWith(item.url) ? 'bg-orange-100 text-orange-700 shadow-sm border border-orange-200' : 'text-gray-600'
                                } ${item.title === 'דף הבקרה' ? 'bg-red-50 border-red-200 text-red-700' : ''}`}
                              >
                                <Link to={item.url} className="flex items-center gap-3 px-4 py-3 relative">
                                  <item.icon className="w-5 h-5" />
                                  <span className="font-medium">{item.title}</span>
                                  {badgeCount > 0 && (
                                    <Badge className="absolute -top-1 -left-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                                      {badgeCount > 9 ? '9+' : badgeCount}
                                    </Badge>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="border-t border-orange-200 p-4 bg-orange-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-orange-600 hover:bg-orange-100"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </SidebarFooter>
              </>
            )}
          </Sidebar>

          <main className="flex-1 flex flex-col relative pb-20 md:pb-0">
            {/* Mobile Header with Hamburger */}
            {user && (
              <div className="md:hidden bg-white border-b border-orange-200 p-4 flex items-center justify-between">
                <SidebarTrigger>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SidebarTrigger>
                <Logo size="small" showText={true} />
                <NotificationCenter />
              </div>
            )}

            <div className="flex-1 overflow-auto">
              {children}
            </div>

            {/* Bottom Navigation for Mobile */}
            {user && (
              <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-orange-200 p-2 md:hidden z-50">
                <div className="flex justify-around">
                  {menuItems.filter(item => 
                    item.title !== "דף הבקרה" && 
                    item.title !== "השיחות שלי" && 
                    item.title !== "צור קשר"
                  ).map(item => {
                    const badgeCount = item.needsBadge ? badgeCounts[item.needsBadge] || 0 : 0;
                    
                    return (
                      <Link to={item.url} key={item.title} className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 relative ${location.pathname.startsWith(item.url) ? 'text-orange-600' : 'text-gray-500'}`}>
                        <item.icon className="w-6 h-6"/>
                        <span className="text-xs mt-1">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
