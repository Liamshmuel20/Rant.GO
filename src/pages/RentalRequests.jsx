
import React, { useState, useEffect } from "react";
import { RentalRequest } from "@/api/entities";
import { Contract } from "@/api/entities";
import { User } from "@/api/entities";
import { Product } from "@/api/entities";
import { Payment } from "@/api/entities";
import { ChatMessage } from "@/api/entities";
import { Notification } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock,
  Check,
  X,
  Calendar,
  User as UserIcon,
  Mail,
  MessageSquare,
  FileText,
  Send,
  UserCheck // New Icon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function RentalRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const allRequests = await RentalRequest.list("-created_date");
      // Filter requests for products owned by current user
      const myRequests = allRequests.filter(request => 
        request.landlord_email === currentUser.email
      );
      
      setRequests(myRequests);
    } catch (error) {
      console.error("Error loading requests:", error);
    }

    setIsLoading(false);
  };

  const handleApprove = async (request) => {
    setProcessingId(request.id);
    
    try {
      const products = await Product.list();
      const product = products.find(p => p.id === request.product_id);
      if (!product) throw new Error("Product not found");

      // Calculate totals
      const days = (new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24) + 1;
      const total_price = days * product.price_per_day;
      const COMMISSION_RATE = 0.10; // 10% commission
      const commission_amount = total_price * COMMISSION_RATE;
      const landlord_payout = total_price - commission_amount;

      // Create contract
      const contractData = {
        product_id: product.id,
        landlord_name: product.owner_name,
        landlord_id: product.owner_id,
        landlord_email: request.landlord_email,
        tenant_name: request.tenant_name,
        tenant_id: request.tenant_id,
        tenant_email: request.tenant_email,
        tenant_phone: request.tenant_phone,
        product_description: product.title,
        damage_compensation_amount: product.damage_compensation_amount,
        start_date: request.start_date,
        end_date: request.end_date,
        status: "ממתין לתשלום", // Contract status
        total_price: total_price,
        commission_rate: COMMISSION_RATE,
        commission_amount: commission_amount,
        landlord_payout: landlord_payout
      };

      // Generate contract text
      const contractText = generateContractText(contractData, {
        total_price,
        commission_amount,
        landlord_payout
      });
      contractData.contract_text = contractText;

      const contract = await Contract.create(contractData);

      // Update request status and add payment amounts AND contract_id
      await RentalRequest.update(request.id, { 
        status: "אושר ממתין לתשלום",
        total_amount: total_price,
        commission_amount: commission_amount,
        landlord_amount: landlord_payout,
        contract_id: contract.id
      });

      // Create payment record
      await Payment.create({
        contract_id: contract.id,
        tenant_email: request.tenant_email,
        landlord_email: request.landlord_email,
        total_amount: total_price,
        commission_amount: commission_amount,
        landlord_amount: landlord_payout,
        tenant_payment_status: "ממתין לתשלום",
        landlord_received_status: "ממתין לאישור"
      });

      // Send notification to admin (you)
      await Notification.create({
        user_email: "liampo10806@gmail.com",
        title: "בקשת השכרה חדשה אושרה",
        message: `בקשה להשכרת ${product.title} אושרה ונוצר חוזה. ממתין לתשלום השוכר.`,
        type: "approval",
        related_id: contract.id,
        action_url: createPageUrl(`AdminDashboard`)
      });

      // Send notification to tenant
      await Notification.create({
        user_email: request.tenant_email,
        title: "בקשת ההשכרה אושרה!",
        message: `בקשתך להשכרת ${product.title} אושרה! כעת עליך לבצע תשלום של ${total_price}₪`,
        type: "approval",
        related_id: contract.id,
        action_url: createPageUrl(`PaymentSelection?requestId=${request.id}`)
      });

      // Send notification to landlord
      await Notification.create({
        user_email: request.landlord_email,
        title: "בקשה אושרה בהצלחה",
        message: `אישרת בהצלחה את בקשת ההשכרה עבור ${product.title}. השוכר יקבל הודעה לבצע תשלום.`,
        type: "status_update",
        related_id: contract.id
      });

      // Send initial chat messages
      const systemMessage = `🎉 מזל טוב! ההשכרה אושרה ונוצר חוזה.
      
השוכר צריך כעת לבצע תשלום של ${total_price}₪.
לאחר התשלום והאישור ממנהלת המערכת, ההשכרה תהפוך לפעילה.

הצ'אט זמין כעת לתיאומים נוספים.`;

      await ChatMessage.create({
        contract_id: contract.id,
        sender_email: "system@rantgo.com",
        receiver_email: request.tenant_email,
        message: systemMessage
      });

      await ChatMessage.create({
        contract_id: contract.id,
        sender_email: "system@rantgo.com",  
        receiver_email: request.landlord_email,
        message: systemMessage
      });

      alert("הבקשה אושרה בהצלחה! נוצר חוזה והשוכר יקבל הודעה לבצע תשלום.");
      loadData(); // Reload data to reflect the status change
      
    } catch (error) {
      console.error("Error approving request:", error);
      alert("שגיאה באישור הבקשה. אנא נסה שוב.");
    }
    
    setProcessingId(null);
  };

  const handleReject = async (request) => {
    setProcessingId(request.id);
    
    try {
      await RentalRequest.update(request.id, { status: "נדחה" });
      alert("הבקשה נדחתה.");
      loadData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("שגיאה בדחיית הבקשה. אנא נסה שוב.");
    }
    
    setProcessingId(null);
  };
  
  // REMOVED handleLandlordConfirm function

  const generateContractText = (contractData, financials) => {
    const startDate = format(new Date(contractData.start_date), "dd/MM/yyyy");
    const endDate = format(new Date(contractData.end_date), "dd/MM/yyyy");

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; direction: rtl; background: #fff; border: 1px solid #ddd; border-radius: 12px;">
        <h1 style="text-align: center; color: #ea580c; margin-bottom: 30px; font-size: 2em; font-weight: bold;">חוזה השכרה</h1>
        
        <p>המשכיר: <strong>${contractData.landlord_name}</strong><br>ת"ז: <strong>${contractData.landlord_id}</strong></p>
        <p style="text-align: center; margin: 15px 0;">לבין</p>
        <p>השוכר: <strong>${contractData.tenant_name}</strong><br>ת"ז: <strong>${contractData.tenant_id}</strong></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

        <h2 style="color: #ea580c; margin-top: 20px; font-size: 1.3em;">1. פרטי העסקה:</h2>
        <p>תיאור המוצר: <strong>${contractData.product_description}</strong></p>
        <p>תקופת השכירות: מ-<strong>${startDate}</strong> ועד <strong>${endDate}</strong></p>

        <h2 style="color: #ea580c; margin-top: 20px; font-size: 1.3em;">2. פירוט תשלומים:</h2>
        <p>עלות השכירות הכוללת: <strong>${financials.total_price.toFixed(2)} ₪</strong></p>
        <p>עמלת Rent.GO (${(contractData.commission_rate * 100).toFixed(0)}%): <strong>${financials.commission_amount.toFixed(2)} ₪</strong></p>
        <p>סכום שיועבר למשכיר: <strong>${financials.landlord_payout.toFixed(2)} ₪</strong></p>

        <h2 style="color: #ea580c; margin-top: 20px; font-size: 1.3em;">3. אחריות לנזק:</h2>
        <p>במקרה של נזק – השוכר ישלם פיצוי של <strong>${contractData.damage_compensation_amount} ₪</strong>.</p>

        <h2 style="color: #ea580c; margin-top: 20px; font-size: 1.3em;">4. החזרת המוצר:</h2>
        <p>השוכר מתחייב להחזיר את המוצר תקין ובזמן.</p>

        <h2 style="color: #ea580c; margin-top: 20px; font-size: 1.3em;">5. תנאים כלליים:</h2>
        <p>• השוכר אחראי לשמירה על המוצר ולשימוש בו בצורה נאותה<br>
        • במקרה של איחור בהחזרה, יגבה תשלום נוסף לפי התעריף היומי<br>
        • הסכם זה כפוף לחוקי מדינת ישראל</p>

        <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <p style="text-align: center;">______________________<br>חתימת המשכיר</p>
          <p style="text-align: center;">______________________<br>חתימת השוכר</p>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background: #fff7ed; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #ea580c; font-weight: bold;">חוזה זה נוצר באמצעות Rent.GO</p>
        </div>
      </div>
    `;
  };

  const getFilteredRequests = (filter) => {
    switch (filter) {
      case "pending":
        return requests.filter(r => r.status === "ממתין לאישור");
      case "approved":
        return requests.filter(r => ["אושר ממתין לתשלום", "שולם ממתין לאישור מנהלת", "הושלם"].includes(r.status));
      case "rejected":
        return requests.filter(r => r.status === "נדחה");
      default:
        return requests;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ממתין לאישור":
        return "bg-yellow-500";
      case "אושר ממתין לתשלום":
        return "bg-blue-500";
      case "שולם ממתין לאישור מנהלת":
        return "bg-indigo-500";
      case "הושלם":
        return "bg-green-500";
      case "נדחה":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">בקשות השכרה</h1>
            <p className="text-gray-600 mt-1">נהל את בקשות השכרה למוצרים שלך</p>
          </div>
          <Link to={createPageUrl("MyContracts")}>
            <Button variant="outline">
              <FileText className="w-4 h-4 ml-2" />
              צפה בחוזים שלי
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">כל הבקשות ({requests.length})</TabsTrigger>
            <TabsTrigger value="pending">ממתינות לאישור ({getFilteredRequests("pending").length})</TabsTrigger>
            <TabsTrigger value="approved">אושרו ({getFilteredRequests("approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">נדחו ({getFilteredRequests("rejected").length})</TabsTrigger>
          </TabsList>

          {["all", "pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {getFilteredRequests(tab).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">אין בקשות להצגה</h3>
                    <p className="text-gray-500">
                      {tab === "all" && "טרם התקבלו בקשות השכרה"}
                      {tab === "pending" && "אין בקשות ממתינות לאישור"}
                      {tab === "approved" && "אין בקשות מאושרות"}
                      {tab === "rejected" && "אין בקשות נדחות"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {getFilteredRequests(tab).map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {request.product_title}
                                <Badge className={`${getStatusColor(request.status)} text-white`}>
                                  {request.status}
                                </Badge>
                              </h3>
                              <p className="text-sm text-gray-500">
                                נוצרה: {format(new Date(request.created_date), "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-blue-500" />
                              <span>שוכר: {request.tenant_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-green-500" />
                              <span>{request.tenant_email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-orange-500" />
                              <span>
                                {format(new Date(request.start_date), "dd/MM")} - {format(new Date(request.end_date), "dd/MM")}
                              </span>
                            </div>
                          </div>

                          {/* Financial Info for approved requests */}
                          {request.total_amount && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">פרטי תשלום:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <span>סך הכל: <strong>{request.total_amount}₪</strong></span>
                                <span>עמלה: <strong>{request.commission_amount}₪</strong></span>
                                <span>למשכיר: <strong>{request.landlord_amount}₪</strong></span>
                              </div>
                            </div>
                          )}

                          {request.message && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold text-sm">הודעה מהשוכר:</span>
                              </div>
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          )}

                          {request.status === "ממתין לאישור" && (
                            <div className="flex gap-3 pt-4 border-t">
                              <Button
                                onClick={() => handleApprove(request)}
                                disabled={processingId === request.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processingId === request.id ? "מעבד..." : (
                                  <>
                                    <Check className="w-4 h-4 ml-2" />
                                    אשר בקשה
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(request)}
                                disabled={processingId === request.id}
                              >
                                <X className="w-4 h-4 ml-2" />
                                דחה
                              </Button>
                            </div>
                          )}
                          
                          {/* REMOVED Landlord Confirmation section */}
                          
                          {request.status === "אושר ממתין לתשלום" && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <p className="text-sm text-yellow-800">
                                ✅ בקשה אושרה! השוכר יקבל הודעה לבצע תשלום של {request.total_amount}₪
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
