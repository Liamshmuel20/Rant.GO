
import React, { useState, useEffect } from 'react';
import { RentalRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Building2, 
  Phone, 
  ArrowRight,
  DollarSign,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function PaymentSelection() {
  const [request, setRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const requestId = new URLSearchParams(window.location.search).get('requestId');
  const navigate = useNavigate();

  // פרטי התשלום שלך
  const ADMIN_PHONE = "0529515990";
  const ADMIN_BANK_DETAILS = {
    bankName: "בנק הפועלים",
    branch: "הקריון 746",
    account: "439105",
    accountHolder: "ת.ז: 216138024"
  };

  useEffect(() => {
    if (requestId) {
      loadData();
    } else {
      navigate(createPageUrl('Home'));
    }
  }, [requestId]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const requests = await RentalRequest.list();
      const foundRequest = requests.find(r => 
        r.id === requestId && 
        r.tenant_email === currentUser.email &&
        r.status === "אושר ממתין לתשלום"
      );

      if (!foundRequest) {
        alert("בקשה לא נמצאה או שאינה זמינה לתשלום");
        navigate(createPageUrl('Home'));
        return;
      }

      setRequest(foundRequest);
    } catch (error) {
      console.error("Error loading request:", error);
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    // כאן תוכלי להוסיף מעקב אחר איזה שיטת תשלום נבחרה
    // לעת עתה, שני הכפתורים יובילו לאותו עמוד אישור תשלום
    navigate(createPageUrl(`ConfirmPayment?requestId=${requestId}&method=${method}`));
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">טוען פרטי תשלום...</p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium">
          <ArrowRight className="w-4 h-4" />
          חזרה לעמוד הבית
        </Link>

        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="w-6 h-6" />
              בחירת אמצעי תשלום
            </CardTitle>
            <p className="text-orange-100 mt-2">בחר את אמצעי התשלום המועדף עליך</p>
          </CardHeader>

          <CardContent className="p-8">
            {/* Request Summary */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg mb-4">סיכום ההזמנה</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>מוצר:</span>
                  <span className="font-medium">{request.product_title}</span>
                </div>
                <div className="flex justify-between">
                  <span>תקופה:</span>
                  <span>{format(new Date(request.start_date), 'dd/MM/yyyy')} - {format(new Date(request.end_date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-bold">סך הכל לתשלום:</span>
                  <span className="font-bold text-xl text-green-600">{request.total_amount}₪</span>
                </div>
              </div>
            </div>

            <Alert className="mb-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>חשוב לדעת:</strong> התשלום מועבר ישירות למנהלת המערכת לביטחון מקסימלי. 
                לאחר אישור התשלום, החוזה ייחתם אוטומטית והצ'אט עם המשכיר יפתח.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <h3 className="font-bold text-xl text-center mb-6">בחר אמצעי תשלום:</h3>

              {/* Bit Payment Option */}
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => handlePaymentMethodSelect('bit')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">תשלום בביט</h4>
                        <p className="text-gray-600">מהיר ונוח - תשלום מיידי</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-500">מספר:</span>
                          <span className="font-mono font-bold">{ADMIN_PHONE}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(ADMIN_PHONE, 'bit');
                            }}
                          >
                            {copied === 'bit' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Bank Transfer Option */}
              <Card className="border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer"
                    onClick={() => handlePaymentMethodSelect('bank')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">העברה בנקאית</h4>
                        <p className="text-gray-600">מסורתי ובטוח</p>
                        <div className="text-sm text-gray-500 mt-2 space-y-1">
                          <div><strong>בנק:</strong> {ADMIN_BANK_DETAILS.bankName}</div>
                          <div><strong>סניף:</strong> {ADMIN_BANK_DETAILS.branch}</div>
                          <div><strong>חשבון:</strong> {ADMIN_BANK_DETAILS.account}</div>
                          <div><strong>בעל החשבון:</strong> {ADMIN_BANK_DETAILS.accountHolder}</div>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800 text-center">
                💡 <strong>טיפ:</strong> תשלום בביט מהיר יותר ומאפשר אישור מיידי של העסקה
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
