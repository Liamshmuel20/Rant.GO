
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Contract } from "@/api/entities";
import { ChatMessage } from "@/api/entities";
import { Product } from "@/api/entities";
import { Payment } from "@/api/entities";
import { Notification } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Shield,
  MessageSquare,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Eye,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const COLORS = ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed'];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingPaymentContracts, setPendingPaymentContracts] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // New state for products
  const [analyticsData, setAnalyticsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser.email !== "liampo10806@gmail.com") {
        alert("אין לך הרשאה לגשת לדף זה");
        window.location.href = createPageUrl("Home");
        return;
      }

      const [contracts, products, payments, users] = await Promise.all([
        Contract.list("-created_date"),
        Product.list("-created_date"),
        Payment.list("-created_date"),
        User.list("-created_date")
      ]);

      setAllContracts(contracts);
      setAllProducts(products); // Store all products
      setPendingPaymentContracts(contracts.filter(c => c.status === 'ממתין לתשלום'));
      setActiveContracts(contracts.filter(c => c.status === 'פעיל'));
      
      // NEW LOGIC FOR PENDING APPROVALS
      // Base the list on contracts awaiting admin approval, making it more robust.
      const pendingApprovalContracts = contracts.filter(c => c.status === 'ממתין לאישור מנהלת');
      
      const enrichedPending = pendingApprovalContracts.map(contract => {
          const product = products.find(prod => prod.id === contract.product_id);
          // The payment record is still needed for financial details
          const payment = payments.find(p => p.contract_id === contract.id);
          return { ...payment, contract, product }; // Combine all info, prioritizing payment/contract id
      }).filter(p => p.contract && p.product && p.id); // Ensure payment object is found and valid

      setPendingApprovals(enrichedPending);

      const totalRevenue = payments
        .filter(p => p.landlord_received_status === "אושר")
        .reduce((sum, p) => sum + (p.commission_amount || 0), 0);

      setStats({
        totalRevenue,
        activeContracts: activeContracts.length, // Uses the state variable updated just above
        totalProducts: products.length,
        totalUsers: users.length,
        pendingPayments: pendingApprovalContracts.length // Count based on contracts
      });

      setAnalyticsData(generateAnalyticsData(contracts, payments, products, users));

    } catch (error) {
      console.error("Error loading admin data:", error);
      // Avoid redirecting on simple network errors, but log them
    }
    setIsLoading(false);
  };

  const generateAnalyticsData = (contracts, payments, products, users) => {
    // Monthly revenue data
    const monthlyRevenue = {};
    payments.filter(p => p.landlord_received_status === "אושר").forEach(payment => {
      const month = format(new Date(payment.created_date), 'yyyy-MM');
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (payment.commission_amount || 0);
    });

    const revenueChartData = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        revenue
      }));

    // Category distribution
    const categoryCount = {};
    products.forEach(product => {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    });

    const categoryChartData = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count
      }));

    // Contract status distribution
    const statusCount = {};
    contracts.forEach(contract => {
      statusCount[contract.status] = (statusCount[contract.status] || 0) + 1;
    });

    const statusChartData = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count
    }));

    // User growth
    const userGrowth = {};
    users.forEach(user => {
      const month = format(new Date(user.created_date), 'yyyy-MM');
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    });

    const userGrowthData = Object.entries(userGrowth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        users: count
      }));

    return {
      revenueChartData,
      categoryChartData,
      statusChartData,
      userGrowthData
    };
  };

  const handleApprovePayment = async (payment) => {
    if (!payment || !payment.contract) {
        alert("שגיאה: פרטי תשלום או חוזה חסרים.");
        return;
    }
    setProcessingId(payment.id);

    try {
      await Payment.update(payment.id, {
        landlord_received_status: "אושר",
        landlord_confirmation_date: new Date().toISOString()
      });

      await Contract.update(payment.contract.id, { status: "פעיל" });

      const systemMessage = `✅ התשלום אושר! ההשכרה כעת פעילה.

🎉 הצ'אט זמין כעת לתיאומים נוספים.
📞 פרטי קשר:
• שוכר: ${payment.contract.tenant_name} - ${payment.contract.tenant_phone}
• משכיר: ${payment.contract.landlord_name} - ${payment.contract.landlord_phone || 'לא זמין'}

💰 הסכום של ${payment.landlord_amount}₪ יועבר למשכיר תוך 24-48 שעות.`;

      await ChatMessage.create({
        contract_id: payment.contract.id,
        sender_email: "system@rantgo.com",
        receiver_email: payment.contract.tenant_email,
        message: systemMessage
      });

      await ChatMessage.create({
        contract_id: payment.contract.id,
        sender_email: "system@rantgo.com",
        receiver_email: payment.contract.landlord_email,
        message: systemMessage
      });

      // Send notifications with contact details
      await Notification.create({
        user_email: payment.contract.tenant_email,
        title: "ההשכרה פעילה! 🎉",
        message: `ההשכרה של ${payment.contract.product_description} פעילה כעת. פרטי המשכיר: ${payment.contract.landlord_name} - ${payment.contract.landlord_phone || 'לא זמין'}`,
        type: "approval",
        related_id: payment.contract.id,
        action_url: createPageUrl(`Chat?contractId=${payment.contract.id}`)
      });

      await Notification.create({
        user_email: payment.contract.landlord_email,
        title: "ההשכרה פעילה! 🎉",
        message: `ההשכרה של ${payment.contract.product_description} פעילה כעת. פרטי השוכר: ${payment.contract.tenant_name} - ${payment.contract.tenant_phone}`,
        type: "approval",
        related_id: payment.contract.id,
        action_url: createPageUrl(`Chat?contractId=${payment.contract.id}`)
      });

      alert("התשלום אושר בהצלחה! הצדדים קיבלו את פרטי הקשר של זה ומוזמנים לתאם באמצעות הצ'אט.");
      loadAdminData();

    } catch (error) {
      console.error("Error approving payment:", error);
      alert("שגיאה באישור התשלום.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    const confirmed = window.confirm(`האם את בטוחה שברצונך למחוק את המוצר "${productTitle}"? פעולה זו לא ניתנת לביטול.`);
    
    if (!confirmed) return;

    setProcessingId(productId);
    try {
      await Product.delete(productId);
      alert(`המוצר "${productTitle}" נמחק בהצלחה.`);
      loadAdminData(); // Reload data to reflect changes
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("שגיאה במחיקת המוצר. אנא נסה שוב.");
    } finally {
      setProcessingId(null);
    }
  };

  const renderContractList = (contracts) => (
    <div className="space-y-4">
      {contracts.map(contract => (
        <div key={contract.id} className="p-4 border rounded-lg hover:bg-gray-50">
            <h4 className="font-semibold">{contract.product_description}</h4>
            <p className="text-sm text-gray-600">
              {contract.tenant_name} ↔ {contract.landlord_name}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              <span>סך עסקה: {contract.total_price}₪</span> |
              <span> תקופה: {format(new Date(contract.start_date), 'dd/MM')} - {format(new Date(contract.end_date), 'dd/MM')}</span>
            </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">טוען נתוני ניהול...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">דף בקרה - מנהלת מערכת</h1>
            <p className="text-gray-600">ניהול וצפייה בכל הפעילות באפליקציה</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">סה"כ הכנסות</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue?.toFixed(0)}₪</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">חוזים פעילים</p>
                  <p className="text-2xl font-bold">{stats.activeContracts}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">מוצרים</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">משתמשים</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">ממתינים לאישור</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="approvals" className="relative">
              אישורים ממתינים
              {pendingApprovals.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              אנליטיקה
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              ניהול מוצרים ({allProducts.length})
            </TabsTrigger>
            <TabsTrigger value="pendingPayment">ממתינים לתשלום ({pendingPaymentContracts.length})</TabsTrigger>
            <TabsTrigger value="activeContracts">חוזים פעילים ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="allContracts">כל החוזים ({allContracts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-6">
            <Card>
              <CardHeader><CardTitle>אישורי תשלום ממתינים</CardTitle></CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>אין אישורים שממתינים לך כרגע.</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {pendingApprovals.map(approval => (
                    <div key={approval.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{approval.product.title}</h4>
                        <p className="text-sm text-gray-600">
                          {approval.contract.tenant_name} ↔ {approval.contract.landlord_name}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          <span>סך עסקה: {approval.total_amount}₪</span> |
                          <span> עמלה: {approval.commission_amount}₪</span> |
                          <span> למשכיר: {approval.landlord_amount}₪</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleApprovePayment(approval)}
                        disabled={processingId === approval.id}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
                      >
                         {processingId === approval.id ? <Loader2 className="w-4 h-4 animate-spin"/> : "אשר תשלום והפעל עסקה"}
                      </Button>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    הכנסות חודשיות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}₪`, 'הכנסות']} />
                      <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    צמיחת משתמשים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}`, 'משתמשים חדשים']} />
                      <Bar dataKey="users" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    פילוח קטגוריות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.categoryChartData}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({category, count}) => `${category}: ${count}`}
                      >
                        {analyticsData.categoryChartData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Contract Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    סטטוס חוזים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}`, 'חוזים']} />
                      <Bar dataKey="count" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  ניהול מוצרים
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">אין מוצרים במערכת.</p>
                ) : (
                  <div className="space-y-4">
                    {allProducts.map(product => (
                      <div key={product.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{product.title}</h4>
                            <p className="text-sm text-gray-600">{product.description}</p>
                            <div className="text-xs text-gray-500 mt-2">
                              <span>בעלים: {product.owner_name}</span> |
                              <span> קטגוריה: {product.category}</span> |
                              <span> מחיר: {product.price_per_day}₪ ליום</span> |
                              <span> מיקום: {product.location}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              נוצר: {format(new Date(product.created_date), 'dd/MM/yyyy HH:mm')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={product.is_available ? "bg-green-500" : "bg-gray-500"}>
                              {product.is_available ? "זמין" : "לא זמין"}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id, product.title)}
                              disabled={processingId === product.id}
                            >
                              {processingId === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "מחק"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendingPayment" className="mt-6">
             <Card>
              <CardHeader><CardTitle>חוזים ממתינים לתשלום</CardTitle></CardHeader>
              <CardContent>
                {pendingPaymentContracts.length === 0 ? <p className="text-center text-gray-500 py-8">אין חוזים שממתינים לתשלום.</p> : renderContractList(pendingPaymentContracts)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activeContracts" className="mt-6">
             <Card>
              <CardHeader><CardTitle>חוזים פעילים כעת</CardTitle></CardHeader>
              <CardContent>
                {activeContracts.length === 0 ? <p className="text-center text-gray-500 py-8">אין כרגע חוזים פעילים.</p> : renderContractList(activeContracts)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allContracts" className="mt-6">
             <Card>
              <CardHeader><CardTitle>כל החוזים במערכת</CardTitle></CardHeader>
              <CardContent>
                {allContracts.length === 0 ? <p className="text-center text-gray-500 py-8">אין חוזים במערכת.</p> : renderContractList(allContracts)}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
