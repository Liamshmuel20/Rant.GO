
import React, { useState, useEffect } from 'react';
import { Contract } from '@/api/entities';
import { Payment } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowRight,
  Shield,
  Phone,
  Banknote,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PaymentInstructions() {
  const [contract, setContract] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState('');
  const navigate = useNavigate();

  const contractId = new URLSearchParams(window.location.search).get('contractId');
  
  // פרטי התשלום שלך
  const ADMIN_PHONE = "0529515990";
  const ADMIN_BANK_DETAILS = "בנק הפועלים (12), סניף 123, חשבון 456789, על שם Rant.GO"; // <--- החליפי לפרטי הבנק שלך

  useEffect(() => {
    loadData();
  }, [contractId]);

  const loadData = async () => {
    if (!contractId) {
      navigate(createPageUrl('Home'));
      return;
    }
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const contracts = await Contract.list();
      const foundContract = contracts.find(c => c.id === contractId);
      setContract(foundContract);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };
  
  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      const payments = await Payment.filter({ contract_id: contract.id });
      if (payments.length > 0) {
        const paymentId = payments[0].id;
        await Payment.update(paymentId, { 
          tenant_payment_status: 'שילם',
          tenant_payment_date: new Date().toISOString(),
        });
      }
      
      await Contract.update(contract.id, { status: 'ממתין לאישור מנהלת' });

      alert('תודה על הדיווח! מנהלת המערכת תאמת את התשלום ותעדכן את סטטוס ההשכרה בהקדם.');
      navigate(createPageUrl(`Chat?contractId=${contract.id}`));
    } catch (error) {
        console.error('Error confirming payment:', error);
        alert('שגיאה בדיווח על התשלום. אנא נסה שוב.');
    }
    setIsSubmitting(false);
  };


  if (isLoading || !contract) {
    return <div className="p-6 flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl(`Chat?contractId=${contract.id}`)} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium">
          <ArrowRight className="w-4 h-4" />
          חזרה לצ'אט
        </Link>
        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle>הוראות תשלום</CardTitle>
            <p className="text-orange-100 mt-1">סכום לתשלום: <strong>{contract.total_price?.toFixed(2)}₪</strong></p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Alert variant="default" className="bg-orange-50 border-orange-200">
              <Shield className="h-4 w-4 text-orange-600" />
              <AlertTitle className="font-bold text-orange-800">חשוב לדעת!</AlertTitle>
              <AlertDescription className="text-orange-700">
                התשלום מועבר למנהלת האפליקציה Rant.GO. לאחר אימות התשלום, הכסף יועבר למשכיר (בניכוי עמלה) וההשכרה תהפוך לפעילה.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="font-bold text-lg">אפשרות 1: תשלום בביט / PayBox</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <span className="font-mono text-lg">{ADMIN_PHONE}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ADMIN_PHONE, 'phone')}>
                  {copied === 'phone' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">אפשרות 2: העברה בנקאית</h3>
               <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-green-600" />
                  <span className="text-sm">{ADMIN_BANK_DETAILS}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ADMIN_BANK_DETAILS, 'bank')}>
                  {copied === 'bank' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <hr/>

            <div className="text-center space-y-4">
              <h3 className="font-bold text-xl text-gray-800">ביצעת את התשלום?</h3>
              <p className="text-gray-600">
                נא ללחוץ על הכפתור למטה כדי לדווח לנו שהתשלום בוצע.
                אנו נאמת את קבלת התשלום ונעדכן את סטטוס ההשכרה.
              </p>
              <Button onClick={handleConfirmPayment} disabled={isSubmitting} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-5 shadow-md">
                {isSubmitting ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> מעדכן...</> : 'שילמתי, דווח למערכת'}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
