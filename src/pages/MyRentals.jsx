
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Contract } from '@/api/entities';
import { Product } from '@/api/entities';
import { Payment } from '@/api/entities';
import { RentalRequest } from '@/api/entities'; // New import
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Package, 
  Inbox, 
  Calendar,
  DollarSign,
  User as UserIcon,
  MessageSquare,
  Clock,
  CheckCircle, // CheckCircle for alert
  Eye,
  Shield // New import
} from 'lucide-react';
import RentalStatusTracker from '@/components/RentalStatusTracker';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MyRentals() {
  const [user, setUser] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [allContracts, allProducts, allPayments, allRequests] = await Promise.all([
        Contract.list('-created_date'),
        Product.list(),
        Payment.list(),
        RentalRequest.list('-created_date') // Added RentalRequest
      ]);

      const userContracts = allContracts.filter(
        c => c.tenant_email === currentUser.email || c.landlord_email === currentUser.email
      );

      const userRequests = allRequests.filter(
        r => r.tenant_email === currentUser.email || r.landlord_email === currentUser.email
      );

      // Combine contracts and requests for display
      const combinedRentals = [
        ...userContracts.map(c => ({ ...c, type: 'contract' })),
        ...userRequests.filter(r => r.status !== 'הושלם').map(r => ({ ...r, type: 'request' })) // Filter out 'הושלם' requests
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setRentals(combinedRentals);
      setProducts(allProducts);
      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading rentals:', error);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status, type) => {
    if (type === 'request') {
      switch (status) {
        case 'ממתין לאישור': return 'bg-yellow-500';
        case 'אושר ממתין לתשלום': return 'bg-blue-500';
        case 'שולם ממתין לאישור מנהלת': return 'bg-purple-500';
        case 'נדחה': return 'bg-red-500';
        default: return 'bg-gray-400';
      }
    }
    
    switch (status) {
      case 'פעיל': return 'bg-green-500';
      case 'ממתין לתשלום': return 'bg-yellow-500';
      case 'ממתין לאישור מנהלת': return 'bg-blue-500';
      case 'הסתיים': return 'bg-gray-500';
      case 'בוטל': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getUserRole = (rental) => {
    return rental.tenant_email === user?.email ? 'שוכר' : 'משכיר';
  };

  const getOtherParty = (rental) => {
    if (rental.type === 'request') {
      return rental.tenant_email === user?.email ? 'ממתין לאישור המשכיר' : rental.tenant_name;
    }
    return rental.tenant_email === user?.email ? rental.landlord_name : rental.tenant_name;
  };

  const getFilteredRentals = (filter) => {
    switch (filter) {
      case 'active':
        return rentals.filter(r => r.status === 'פעיל');
      case 'pending':
        return rentals.filter(r => ['ממתין לתשלום', 'ממתין לאישור מנהלת', 'ממתין לאישור', 'אושר ממתין לתשלום', 'שולם ממתין לאישור מנהלת'].includes(r.status));
      case 'completed':
        return rentals.filter(r => ['הסתיים', 'בוטל', 'נדחה'].includes(r.status));
      case 'as_tenant':
        return rentals.filter(r => r.tenant_email === user?.email);
      case 'as_landlord':
        return rentals.filter(r => r.landlord_email === user?.email);
      default:
        return rentals;
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getPaymentInfo = (contractId) => {
    return payments.find(p => p.contract_id === contractId);
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">טוען את ההשכרות שלך...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">ההשכרות שלי</h1>
          <p className="text-lg text-gray-600">מעקב מלא אחר כל ההשכרות שלך, כשוכר וכמשכיר</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="all">הכל ({rentals.length})</TabsTrigger>
            <TabsTrigger value="active">פעילות ({getFilteredRentals('active').length})</TabsTrigger>
            <TabsTrigger value="pending">ממתינות ({getFilteredRentals('pending').length})</TabsTrigger>
            <TabsTrigger value="completed">הושלמו ({getFilteredRentals('completed').length})</TabsTrigger>
            <TabsTrigger value="as_tenant">אני שוכר ({getFilteredRentals('as_tenant').length})</TabsTrigger>
            <TabsTrigger value="as_landlord">אני משכיר ({getFilteredRentals('as_landlord').length})</TabsTrigger>
          </TabsList>

          {['all', 'active', 'pending', 'completed', 'as_tenant', 'as_landlord'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {getFilteredRentals(tab).length === 0 ? (
                <Card>
                  <CardContent className="p-16 text-center">
                    <Inbox className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">אין השכרות להצגה</h3>
                    <p className="text-gray-500">
                      {tab === 'all' && 'כאשר תתחיל תהליך השכרה, תוכל לעקוב אחריו כאן'}
                      {tab === 'active' && 'אין השכרות פעילות כרגע'}
                      {tab === 'pending' && 'אין השכרות הממתינות לטיפול'}
                      {tab === 'completed' && 'אין השכרות שהושלמו עדיין'}
                      {tab === 'as_tenant' && 'טרם שכרת מוצרים'}
                      {tab === 'as_landlord' && 'טרם השכרת מוצרים'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {getFilteredRentals(tab).map(rental => {
                    const paymentInfo = rental.type === 'contract' ? getPaymentInfo(rental.id) : null;
                    const days = rental.start_date && rental.end_date ? calculateDays(rental.start_date, rental.end_date) : 0;
                    
                    return (
                      <Card key={`${rental.type}-${rental.id}`} className="shadow-lg border-orange-100 hover:shadow-xl transition-shadow">
                        <CardHeader>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-orange-600"/>
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {rental.product_description || rental.product_title}
                                </CardTitle>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <UserIcon className="w-4 h-4" />
                                    {getUserRole(rental)} • {getOtherParty(rental)}
                                  </span>
                                  {rental.start_date && rental.end_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {format(new Date(rental.start_date), 'dd/MM', {locale: he})} - {format(new Date(rental.end_date), 'dd/MM', {locale: he})} ({days} ימים)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${getStatusColor(rental.status, rental.type)} text-white px-3 py-1`}>
                                {rental.status}
                              </Badge>
                              {rental.type === 'contract' && (
                                <Link to={createPageUrl(`Chat?contractId=${rental.id}`)}>
                                  <Button variant="outline" size="sm">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    צ'אט
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                          {/* NEW NOTIFICATION BOX */}
                          {rental.status === 'אושר ממתין לתשלום' && rental.tenant_email === user?.email && (
                            <Alert className="bg-green-50 border-green-200 text-green-800">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <AlertTitle className="font-bold">הבקשה שלך אושרה!</AlertTitle>
                              <AlertDescription>
                                המשכיר אישר את בקשתך. כעת עליך לבצע תשלום כדי להשלים את התהליך ולהפוך את העסקה לפעילה.
                                <div className="flex flex-wrap gap-4 mt-4">
                                  <Link to={createPageUrl(`PaymentSelection?requestId=${rental.id}`)}>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                      <DollarSign className="w-4 h-4 ml-2" />
                                      מעבר לתשלום
                                    </Button>
                                  </Link>
                                  {/* rental.contract_id refers to the actual contract created upon request approval */}
                                  {rental.contract_id && (
                                    <Link to={createPageUrl(`Chat?contractId=${rental.contract_id}`)}>
                                      <Button size="sm" variant="outline" className="bg-white">
                                        <MessageSquare className="w-4 h-4 ml-2" />
                                        צ'אט עם המשכיר
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {/* Status Tracker */}
                          {rental.type === 'contract' && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-600" />
                                מעקב סטטוס
                              </h4>
                              <RentalStatusTracker 
                                contractStatus={rental.status} 
                                paymentStatus={paymentInfo?.tenant_payment_status}
                              />
                            </div>
                          )}

                          {/* Financial Info */}
                          {rental.total_amount && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-800">סך עסקה</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{rental.total_amount}₪</p>
                              </div>
                              
                              {rental.commission_amount && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-blue-800">עמלת שירות</span>
                                  </div>
                                  <p className="text-xl font-bold text-blue-600">{rental.commission_amount}₪</p>
                                </div>
                              )}
                              
                              {rental.damage_compensation_amount && (
                                <div className="bg-red-50 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-red-600" />
                                    <span className="font-semibold text-red-800">פיצוי נזק</span>
                                  </div>
                                  <p className="text-xl font-bold text-red-600">{rental.damage_compensation_amount}₪</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex gap-3 pt-4 border-t">
                            {rental.type === 'contract' && (
                              <Link to={createPageUrl(`Contract?id=${rental.id}`)}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  צפה בחוזה
                                </Button>
                              </Link>
                            )}
                            {/* The 'מעבר לתשלום' button below is now handled by the new notification box above, removed here */}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
