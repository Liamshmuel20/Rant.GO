import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { RentalRequest } from "@/api/entities";
import { Contract } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowRight, User as UserIcon, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays, addDays } from "date-fns";
import { he } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RentalRequestPage() {
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [message, setMessage] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const productId = new URLSearchParams(window.location.search).get('productId');
  const navigate = useNavigate();

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setTenantName(currentUser.full_name || "");
      setTenantPhone(currentUser.phone || "");

      const products = await Product.list();
      const foundProduct = products.find(p => p.id === productId);
      
      if (!foundProduct) {
        alert("מוצר לא נמצא");
        navigate(createPageUrl("Home"));
        return;
      }
      
      setProduct(foundProduct);
      
    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl("Home"));
    }

    setIsLoading(false);
  };

  const calculateTotalPrice = () => {
    if (!startDate || !endDate || !product) return 0;
    const days = differenceInDays(endDate, startDate) + 1;
    return days * product.price_per_day;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !product) return;
    
    if (!startDate || !endDate) {
      alert("אנא בחר תאריכי השכרה");
      return;
    }

    if (!tenantName.trim() || !tenantId.trim() || !tenantPhone.trim()) {
      alert("אנא מלא את כל הפרטים הנדרשים");
      return;
    }

    if (!agreedToTerms) {
      alert("אנא אשר את תנאי השימוש");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        product_id: product.id,
        product_title: product.title,
        landlord_email: product.created_by,
        tenant_name: tenantName.trim(),
        tenant_id: tenantId.trim(),
        tenant_email: user.email,
        tenant_phone: tenantPhone.trim(),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        message: message.trim()
      };

      await RentalRequest.create(requestData);
      
      alert("בקשת ההשכרה נשלחה בהצלחה! המשכיר יקבל הודעה ויחזור אליך בהקדם.");
      navigate(createPageUrl("MyRentals"));
      
    } catch (error) {
      console.error("Error submitting rental request:", error);
      alert("שגיאה בשליחת הבקשה. אנא נסה שוב.");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600">מוצר לא נמצא</h1>
          <Link to={createPageUrl("Home")}>
            <Button className="mt-4">חזרה לעמוד הבית</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = calculateTotalPrice();
  const days = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link 
          to={createPageUrl(`Product?id=${product.id}`)} 
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה למוצר
        </Link>

        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Send className="w-6 h-6" />
              בקשת השכרה
            </CardTitle>
            <p className="text-orange-100 mt-2">מלא את הפרטים לשליחת בקשת השכרה</p>
          </CardHeader>

          <CardContent className="p-8">
            {/* Product Info */}
            <div className="mb-8 p-4 bg-orange-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">{product.title}</h3>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-green-600">{product.price_per_day}₪ ליום</span>
                <span className="text-gray-500">פיצוי נזק: {product.damage_compensation_amount}₪</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-orange-600" />
                  פרטים אישיים
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantName">שם מלא *</Label>
                    <Input
                      id="tenantName"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenantId">תעודת זהות *</Label>
                    <Input
                      id="tenantId"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="123456789"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tenantPhone">מספר טלפון *</Label>
                  <Input
                    id="tenantPhone"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="050-1234567"
                    required
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-orange-600" />
                  תאריכי השכרה
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>תאריך התחלה *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-right font-normal mt-2"
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          locale={he}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>תאריך סיום *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-right font-normal mt-2"
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < (startDate || new Date())}
                          locale={he}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Price Calculation */}
                {startDate && endDate && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">חישוב עלות:</h4>
                    <div className="space-y-1 text-sm">
                      <div>מספר ימים: {days}</div>
                      <div>מחיר ליום: {product.price_per_day}₪</div>
                      <div className="font-bold text-lg text-green-600">
                        סה"כ: {totalPrice}₪
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">הודעה למשכיר (אופציונלי)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="תאר את הצורך שלך במוצר או שאל שאלות..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Checkbox
                  id="agreedToTerms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                />
                <Label htmlFor="agreedToTerms" className="text-sm leading-relaxed cursor-pointer">
                  אני מאשר/ת ומסכים/ה לתנאי השימוש ומתחייב/ת לטפל במוצר בזהירות ולהחזירו במצב תקין.
                  במקרה של נזק, אשלם פיצוי של {product.damage_compensation_amount}₪.
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl py-6 shadow-lg"
                disabled={isSubmitting || !agreedToTerms}
              >
                {isSubmitting ? "שולח בקשה..." : "שלח בקשת השכרה"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}