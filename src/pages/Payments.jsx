import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { RentalRequest } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  CreditCard,
  Inbox, 
  Calendar,
  DollarSign,
  User as UserIcon,
  MessageSquare,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [user, setUser] = useState(null);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser) {
        const allRequests = await RentalRequest.list('-created_date');
        const userPaymentRequests = allRequests.filter(
          r => r.tenant_email === currentUser.email && r.status === 'אושר ממתין לתשלום'
        );
        setPaymentRequests(userPaymentRequests);
      }
    } catch (error) {
      console.error('Error loading payment requests:', error);
    }
    setIsLoading(false);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">טוען בקשות תשלום...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <CreditCard className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">תשלומים לביצוע</h1>
            <p className="text-gray-600">כל ההשכרות שממתינות לתשלום מרוכזות כאן</p>
          </div>
        </div>

        {paymentRequests.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Inbox className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">אין תשלומים ממתינים</h3>
              <p className="text-gray-500">כאשר בקשת השכרה שלך תאושר, היא תופיע כאן לתשלום.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {paymentRequests.map(request => (
              <Card key={request.id} className="shadow-lg border-orange-100 hover:shadow-xl transition-shadow overflow-hidden">
                <CardHeader className="bg-orange-50 p-0">
                   <Alert className="bg-green-50 border-green-200 text-green-800 rounded-none border-0 border-b">
                      <Info className="h-5 w-5 text-green-600" />
                      <AlertTitle className="font-bold">בקשתך אושרה!</AlertTitle>
                      <AlertDescription>
                        המשכיר אישר את הבקשה. כעת עליך לבצע תשלום כדי להשלים את התהליך.
                      </AlertDescription>
                    </Alert>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2">{request.product_title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                       <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span>תאריכים: {format(new Date(request.start_date), 'dd/MM/yy')} - {format(new Date(request.end_date), 'dd/MM/yy')}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-orange-500" />
                        <span>משכיר: {request.landlord_email.split('@')[0]}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-gray-800">סכום לתשלום:</span>
                    <span className="text-2xl font-bold text-green-600">{request.total_amount}₪</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 pt-4 border-t">
                    <Link to={createPageUrl(`PaymentSelection?requestId=${request.id}`)}>
                      <Button size="lg" className="bg-green-600 hover:bg-green-700">
                        <DollarSign className="w-5 h-5 ml-2" />
                        בצע תשלום
                      </Button>
                    </Link>
                    {request.contract_id && (
                      <Link to={createPageUrl(`Chat?contractId=${request.contract_id}`)}>
                        <Button size="lg" variant="outline">
                          <MessageSquare className="w-5 h-5 ml-2" />
                          צ'אט עם המשכיר
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}