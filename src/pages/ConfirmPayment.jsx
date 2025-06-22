
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RentalRequest } from '@/api/entities';
import { Contract } from '@/api/entities';
import { Payment } from '@/api/entities';
import { Notification } from '@/api/entities';
import { Product } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  ArrowRight,
  Smartphone,
  Building,
  Check,
  AlertTriangle
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { SendEmail } from "@/api/integrations"; // Added import

const ADMIN_EMAIL = 'liampo10806@gmail.com';
const ADMIN_PHONE = '050-1234567';
const ADMIN_BANK_DETAILS = {
  bank: "בנק לאומי",
  branch: "803",
  account: "123456789"
};

export default function ConfirmPayment() {
  const [request, setRequest] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestId = queryParams.get('requestId');
  const paymentMethod = queryParams.get('method');

  useEffect(() => {
    if (requestId && paymentMethod) {
      loadData();
    } else {
      navigate(createPageUrl("Home"));
    }
  }, [requestId, paymentMethod, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const requests = await RentalRequest.list();
      const foundRequest = requests.find(r => r.id === requestId);

      if (!foundRequest) {
        throw new Error("בקשה לא נמצאה");
      }
      setRequest(foundRequest);

      if (foundRequest.contract_id) {
        const contracts = await Contract.list();
        const associatedContract = contracts.find(c => c.id === foundRequest.contract_id);
        if (associatedContract) {
            setContract(associatedContract);
        } else {
            throw new Error("שגיאה במציאת החוזה המשויך לבקשה.");
        }
      } else {
        throw new Error("שגיאה חמורה: לא נמצא חוזה משויך לבקשה.");
      }

    } catch (error) {
      console.error("Error loading data:", error);
      alert(`שגיאה בטעינת הנתונים: ${error.message || 'אנא נסה שוב.'}`);
      navigate(createPageUrl("Home"));
    }
    setIsLoading(false);
  };

  const handleConfirmPayment = async () => {
    if (!contract || !request || !paymentMethod) {
      alert("שגיאה: פרטי חוזה, בקשה או שיטת תשלום חסרים. אנא רענן את העמוד ונסה שוב.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update statuses to reflect "Awaiting Admin Approval"
      await RentalRequest.update(request.id, { 
        status: "שולם ממתין לאישור מנהלת" 
      });

      await Contract.update(contract.id, { status: "ממתין לאישור מנהלת" });

      // Update payment record
      const payments = await Payment.list();
      let payment = payments.find(p => p.contract_id === contract.id);
      if (payment) {
        await Payment.update(payment.id, {
          tenant_payment_status: "שילם",
          tenant_payment_date: new Date().toISOString(),
          payment_method: paymentMethod
        });
      } else {
        payment = await Payment.create({
          contract_id: contract.id,
          tenant_email: contract.tenant_email,
          landlord_email: contract.landlord_email,
          total_amount: request.total_amount,
          commission_amount: request.commission_amount,
          landlord_amount: request.landlord_amount,
          tenant_payment_status: "שילם",
          landlord_received_status: "ממתין לאישור",
          tenant_payment_date: new Date().toISOString(),
          payment_method: paymentMethod
        });
      }

      // Get product details for bank info
      const products = await Product.list();
      const product = products.find(p => p.id === request.product_id);
      if (!product) {
        throw new Error("שגיאה: לא ניתן למצוא את פרטי המוצר עבור הבקשה.");
      }

      // Prepare detailed message for admin
      const adminMessage = `🔥 בקשה מוכנה לאישורך!

📋 פרטי העסקה:
• מוצר: ${request.product_title}
• שוכר: ${request.tenant_name} (${request.tenant_phone})
• משכיר: ${product.owner_name} (${product.owner_phone})
• תאריכים: ${format(new Date(request.start_date), 'dd/MM/yy')} - ${format(new Date(request.end_date), 'dd/MM/yy')}

💰 פרטי תשלום:
• סך הכל שולם: ${request.total_amount}₪
• עמלה לאפליקציה: ${request.commission_amount}₪
• להעביר למשכיר: ${request.landlord_amount}₪

🏦 פרטי בנק של המשכיר להעברה:
• שם: ${product.owner_name}
• ת"ז: ${product.owner_id}
• בנק: ${product.owner_bank_name}
• סניף: ${product.owner_bank_branch}
• חשבון: ${product.owner_bank_account}
• טלפון: ${product.owner_phone}

אישור התשלום שלך יפעיל את העסקה!`;

      // Send email to admin with transaction details
      const emailBody = `בקשה חדשה מחכה לאישורך באפליקציה!

פרטי העסקה:
==============
מוצר: ${request.product_title}
שוכר: ${request.tenant_name} (${request.tenant_phone})
משכיר: ${product.owner_name} (${product.owner_phone})
תאריכים: ${format(new Date(request.start_date), 'dd/MM/yyyy')} - ${format(new Date(request.end_date), 'dd/MM/yyyy')}

פרטי תשלום:
=============
סך הכל שולם: ${request.total_amount}₪
עמלה לאפליקציה: ${request.commission_amount}₪
סכום להעברה למשכיר: ${request.landlord_amount}₪

פרטי בנק של המשכיר להעברה:
===============================
שם: ${product.owner_name}
תעודת זהות: ${product.owner_id}
בנק: ${product.owner_bank_name}
מספר סניף: ${product.owner_bank_branch}
מספר חשבון: ${product.owner_bank_account}
מספר טלפון: ${product.owner_phone}

לאישור העסקה, היכנסי לאפליקציה ודף הבקרה.

תודה!
מערכת Rant.GO`;

      await SendEmail({
        to: ADMIN_EMAIL,
        subject: `🔥 בקשה חדשה לאישור - ${request.product_title}`,
        body: emailBody
      });

      // Notify Admin in app
      await Notification.create({
        user_email: ADMIN_EMAIL,
        title: "🔥 בקשה מוכנה לאישורך!",
        message: adminMessage,
        type: "approval",
        related_id: contract.id,
        action_url: createPageUrl("AdminDashboard")
      });

      // Notify Landlord about payment received and status change
      await Notification.create({
        user_email: request.landlord_email,
        title: "💰 תשלום התקבל!",
        message: `השוכר ${request.tenant_name} שילם עבור "${request.product_title}". הבקשה הועברה לאישור סופי של מנהלת המערכת. תקבל את התשלום (${request.landlord_amount}₪) תוך 24-48 שעות.`,
        type: "payment",
        related_id: contract.id,
      });
      
      // Notify Tenant about the next step
      await Notification.create({
        user_email: request.tenant_email,
        title: "אישור תשלום נשלח!",
        message: `אישור התשלום שלך עבור "${request.product_title}" נשלח למנהלת המערכת. תקבל עדכון כשהעסקה תהפוך לפעילה.`,
        type: "status_update",
        related_id: contract.id,
      });

      alert("אישור התשלום נשלח בהצלחה! תקבלו עדכון כשהעסקה תאושר סופית.");
      navigate(createPageUrl("MyRentals"));
      
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("שגיאה בשליחת אישור התשלום. אנא נסה שוב.");
    }
    setIsSubmitting(false);
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

  if (!request || !contract || !paymentMethod) {
    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 text-center">שגיאה: לא ניתן לטעון את פרטי הבקשה, החוזה או שיטת התשלום.</p>
        <p className="text-md text-gray-500 mt-2 text-center">נא לוודא שניגשת לעמוד דרך הקישור הנכון.</p>
        <Button onClick={() => navigate(createPageUrl("MyRentals"))} className="mt-4">
          חזרה לבקשות שלי
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle className="w-6 h-6" />
              אישור תשלום
            </CardTitle>
            <p className="text-orange-100 mt-2">
              אנא אשר שביצעת את התשלום בשיטה שבחרת.
            </p>
          </CardHeader>

          <CardContent className="p-8">
            {/* Payment Method Display */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg mb-4">שיטת התשלום שנבחרה</h3>
              {paymentMethod === 'bit' ? (
                 <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <span className="text-base font-medium">תשלום בביט</span>
                 </div>
              ) : (
                <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span className="text-base font-medium">העברה בנקאית</span>
                </div>
              )}
            </div>

            {/* Request Summary */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg mb-4">פרטי התשלום</h3>
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
                  <span className="font-bold">סכום לתשלום:</span>
                  <span className="font-bold text-xl text-green-600">{request.total_amount}₪</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions based on selected method */}
            {paymentMethod === 'bit' ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-lg">תשלום בביט</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">העבר את הסכום למספר הטלפון:</p>
                      <Badge className="bg-white text-gray-900 text-lg font-bold p-3 rounded-md shadow-sm">{ADMIN_PHONE}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">סכום:</p>
                      <Badge className="bg-white text-green-600 text-xl font-bold p-3 rounded-md shadow-sm">{`${request.total_amount}₪`}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Building className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-lg">העברה בנקאית</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">בנק:</span>
                        <div className="font-semibold">{ADMIN_BANK_DETAILS.bank}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">סניף:</span>
                        <div className="font-semibold">{ADMIN_BANK_DETAILS.branch}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">חשבון:</span>
                        <div className="font-semibold font-mono">{ADMIN_BANK_DETAILS.account}</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded border">
                      <span className="text-sm text-gray-600">סכום להעברה:</span>
                      <div className="text-xl font-bold text-green-600">{request.total_amount}₪</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Alert className="my-6">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>חשוב:</AlertTitle>
              <AlertDescription>
                לאחר ביצוע התשלום בפועל, לחץ על "אשר שביצעתי תשלום" למטה.
                המערכת תעביר את העסקה לאישור סופי של מנהלת המערכת.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("MyRentals")} className="flex-1">
                <Button variant="outline" className="w-full h-auto py-3">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  חזרה
                </Button>
              </Link>
              <Button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-auto py-3"
              >
                {isSubmitting ? "מאשר תשלום..." : "אשר שביצעתי תשלום"}
                <Check className="w-4 h-4 mr-2" />
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
                לחיצה על הכפתור מאשרת שביצעת את התשלום בפועל
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
