
import React, { useState, useEffect } from "react";
import { Contract } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  FileText,
  Check,
  Calendar,
  User as UserIcon,
  Building,
  CircleDollarSign,
  Send,
  CheckCircle,
  Shield,
  PenSquare,
  MessageSquare,
  CreditCard // Added CreditCard icon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function ContractPage() {
  const [contract, setContract] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const contractId = urlParams.get('id');

    if (!contractId) {
      navigate(createPageUrl("Home"));
      return;
    }

    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const contracts = await Contract.list();
      const foundContract = contracts.find(c => c.id === contractId);
      
      if (!foundContract) {
        navigate(createPageUrl("Home"));
        return;
      }
      
      setContract(foundContract);

    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl("Home"));
    }

    setIsLoading(false);
  };
  
  const handleSendToTenant = async () => {
    setIsProcessing(true);
    try {
      await Contract.update(contract.id, { status: "ממתין לחתימת שוכר" });
      setContract(prev => ({...prev, status: "ממתין לחתימת שוכר"}));
    } catch (error) {
      console.error("Error sending to tenant:", error);
    }
    setIsProcessing(false);
  }

  const handleTenantSign = async () => {
    setIsProcessing(true);
    try {
      await Contract.update(contract.id, { 
        status: "ממתין לחתימת משכיר",
        tenant_signature_date: new Date().toISOString() 
      });
      setContract(prev => ({...prev, status: "ממתין לחתימת משכיר", tenant_signature_date: new Date().toISOString()}));
    } catch (error) {
      console.error("Error signing as tenant:", error);
    }
    setIsProcessing(false);
  }
  
  const handleLandlordSign = async () => {
    setIsProcessing(true);
    try {
      // Upon landlord final signature, status moves to Awaiting Payment
      await Contract.update(contract.id, { 
        status: "ממתין לתשלום",
        landlord_signature_date: new Date().toISOString()
      });
      setContract(prev => ({...prev, status: "ממתין לתשלום", landlord_signature_date: new Date().toISOString()}));
    } catch (error) {
      console.error("Error signing as landlord:", error);
    }
    setIsProcessing(false);
  }

  const getStatusBadge = () => {
    if (!contract) return null;
    const statusConfig = {
      "טיוטה": "bg-gray-500 text-white",
      "ממתין לחתימת שוכר": "bg-yellow-500 text-gray-900",
      "ממתין לחתימת משכיר": "bg-blue-500 text-white",
      "ממתין לתשלום": "bg-purple-500 text-white",
      "ממתין לאישור תשלום": "bg-amber-500 text-gray-900", // New status
      "פעיל": "bg-green-500 text-white",
      "בוטל": "bg-red-500 text-white"
    };
    return (
      <Badge className={`${statusConfig[contract.status]} hover:${statusConfig[contract.status]} border-0`}>
        {contract.status === "פעיל" && <CheckCircle className="w-3 h-3 ml-1" />}
        {contract.status}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-orange-100 rounded w-64"></div>
            <div className="h-96 bg-orange-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract || !user) {
    return null;
  }
  
  const isLandlord = user.email === contract.created_by;
  const isTenant = user.email === contract.tenant_email;

  const renderSignatureSection = () => {
    return (
      <Card className="shadow-lg border-orange-200">
        <CardHeader><CardTitle>חתימות</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">חתימת השוכר: {contract.tenant_name}</p>
              {contract.tenant_signature_date && <p className="text-sm text-gray-500">נחתם בתאריך: {format(new Date(contract.tenant_signature_date), "dd/MM/yyyy HH:mm")}</p>}
            </div>
            {contract.tenant_signature_date ? 
              <CheckCircle className="w-6 h-6 text-green-500"/> : 
              <PenSquare className="w-6 h-6 text-yellow-500"/>
            }
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">חתימת המשכיר: {contract.landlord_name}</p>
              {contract.landlord_signature_date && <p className="text-sm text-gray-500">נחתם בתאריך: {format(new Date(contract.landlord_signature_date), "dd/MM/yyyy HH:mm")}</p>}
            </div>
            {contract.landlord_signature_date ? 
              <CheckCircle className="w-6 h-6 text-green-500"/> : 
              <PenSquare className="w-6 h-6 text-yellow-500"/>
            }
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const renderFinancialsSection = () => {
    const total_price = contract.total_price || 0;
    const commission_rate = contract.commission_rate || 0.05; 
    const commission_amount = contract.commission_amount !== undefined ? contract.commission_amount : (total_price * commission_rate);
    const landlord_payout = contract.landlord_payout !== undefined ? contract.landlord_payout : (total_price - commission_amount);

    return (
      <Card className="shadow-lg border-orange-200">
        <CardHeader><CardTitle>פרטים פיננסיים</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span>מחיר שכירות:</span> <strong>{total_price.toFixed(2)} ₪</strong></div>
          <div className="flex justify-between"><span>עמלת Rant.GO ({commission_rate * 100}%):</span> <strong className="text-red-600">-{commission_amount.toFixed(2)} ₪</strong></div>
          <hr/>
          <div className="flex justify-between font-bold text-base"><span>סה"כ למשכיר:</span> <strong className="text-green-600">{landlord_payout.toFixed(2)} ₪</strong></div>
        </CardContent>
      </Card>
    )
  }

  const renderActionSection = () => {
    if (contract.status === "טיוטה" && isLandlord) {
      return (
        <Button onClick={handleSendToTenant} disabled={isProcessing} size="lg" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
          <Send className="w-5 h-5 ml-2" />
          {isProcessing ? "שולח..." : "שלח לחתימת השוכר"}
        </Button>
      );
    }
    if (contract.status === "ממתין לחתימת שוכר" && isTenant) {
      return (
        <Card className="border-blue-200 bg-blue-50 p-6">
          <h3 className="font-bold text-lg mb-2">תורך לחתום</h3>
          <p className="text-sm text-gray-600 mb-4">בלחיצה על הכפתור הנך מאשר/ת שקראת את תנאי החוזה ואת/ה מסכים/ה להם במלואם.</p>
          <Button onClick={handleTenantSign} disabled={isProcessing} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Check className="w-5 h-5 ml-2" />
            {isProcessing ? "חותם..." : "אני מאשר וחותם על החוזה"}
          </Button>
        </Card>
      );
    }
    if (contract.status === "ממתין לחתימת משכיר" && isLandlord) {
       return (
        <Card className="border-green-200 bg-green-50 p-6">
          <h3 className="font-bold text-lg mb-2">השוכר חתם! נדרשת חתימתך הסופית</h3>
          <p className="text-sm text-gray-600 mb-4">בלחיצה על הכפתור, החוזה יאושר ויעבור לשלב התשלום.</p>
          <Button onClick={handleLandlordSign} disabled={isProcessing} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="w-5 h-5 ml-2" />
            {isProcessing ? "מאשר..." : "אשר והעבר לתשלום"}
          </Button>
        </Card>
      );
    }
    if (contract.status === "ממתין לתשלום" && isTenant) {
      return (
        <Card className="border-purple-200 bg-purple-50 p-6">
          <h3 className="font-bold text-lg mb-2 text-purple-800">החוזה נחתם! נדרש תשלום</h3>
          <p className="text-sm text-gray-700 mb-1">סכום לתשלום: <strong className="text-lg">{contract.total_price.toFixed(2)} ₪</strong></p>
          <p className="text-xs text-gray-600 mb-4">לחץ למעבר למסך התשלום הידני (ביט/העברה בנקאית)</p>
          <Link to={createPageUrl(`PaymentInstructions?contractId=${contract.id}`)}>
            <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <CreditCard className="w-5 h-5 ml-2" />
              מעבר לתשלום
            </Button>
          </Link>
        </Card>
      );
    }
    if (contract.status === "ממתין לאישור תשלום" && isLandlord) {
      return (
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">השוכר דיווח על תשלום</h3>
          <p className="text-sm text-gray-700 mb-4">בדוק את החשבון שלך ואשר את קבלת התשלום</p>
          <Link to={createPageUrl(`ConfirmPayment?contractId=${contract.id}`)}>
            <Button size="lg" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
              <CheckCircle className="w-5 h-5 ml-2" />
              אשר קבלת תשלום
            </Button>
          </Link>
        </Card>
      );
    }
    if (contract.status === "פעיל") {
      return (
         <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-lg">החוזה פעיל ומחייב!</h3>
                  <p className="text-sm text-green-700">שני הצדדים חתמו על החוזה והתשלום אושר.</p>
                </div>
              </div>
              <Link to={createPageUrl(`Chat?contractId=${contract.id}`)} className="w-full">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    <MessageSquare className="w-4 h-4 ml-2"/>
                    פתח צ'אט
                </Button>
              </Link>
            </CardContent>
          </Card>
      )
    }
    return (
       <Card className="border-gray-200 bg-gray-50 p-6 text-center">
          <h3 className="font-bold text-lg mb-2 text-gray-700">ממתין לפעולה מהצד השני</h3>
          <p className="text-sm text-gray-500">סטטוס החוזה: {contract.status}</p>
       </Card>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("MyContracts")} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-8 font-medium">
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימת החוזים
        </Link>

        <div className="space-y-8">
          <Card className="shadow-xl border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <FileText className="w-7 h-7" />
                  חוזה השכרה
                </CardTitle>
                {getStatusBadge()}
              </div>
              <p className="text-orange-100 mt-2">מזהה חוזה: {contract.id}</p>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <h3 className="font-bold text-xl">סטטוס ופעולות</h3>
              {renderActionSection()}
              {renderSignatureSection()}
            </div>
            <div className="space-y-6">
               <h3 className="font-bold text-xl">פרטים פיננסיים</h3>
               {renderFinancialsSection()}
            </div>
          </div>
          
          <Card className="shadow-lg border-orange-200 mt-8">
            <CardHeader>
              <CardTitle className="text-xl">תוכן החוזה המלא</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                dangerouslySetInnerHTML={{ __html: contract.contract_text }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
