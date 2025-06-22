import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Contract } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight,
  FileText,
  User as UserIcon,
  Package,
  Calendar,
  CircleDollarSign,
  Shield,
  CheckCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreateContract() {
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    tenant_name: "",
    tenant_id: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');

    if (!productId) {
      navigate(createPageUrl("Home"));
      return;
    }

    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.log("User not logged in");
      navigate(createPageUrl("Home"));
      return;
    }

    try {
      const products = await Product.list();
      const foundProduct = products.find(p => p.id === productId);
      
      if (!foundProduct) {
        navigate(createPageUrl("Home"));
        return;
      }

      setProduct(foundProduct);
    } catch (error) {
      console.error("Error loading product:", error);
      navigate(createPageUrl("Home"));
    }

    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || !user) return;

    setIsSubmitting(true);

    try {
      const contractData = {
        product_id: product.id,
        landlord_name: product.owner_name,
        landlord_id: product.owner_id,
        landlord_email: user.email,
        tenant_name: formData.tenant_name,
        tenant_id: formData.tenant_id,
        product_description: product.title + " - " + product.description,
        damage_compensation_amount: product.damage_compensation_amount,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: "טיוטה"
      };

      const contract = await Contract.create(contractData);
      navigate(createPageUrl(`Contract?id=${contract.id}`));
    } catch (error) {
      console.error("Error creating contract:", error);
      alert("שגיאה ביצירת החוזה. אנא נסה שוב.");
    }

    setIsSubmitting(false);
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    return days * (product?.price_per_day || 0);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-orange-100 rounded w-64"></div>
            <div className="h-96 bg-orange-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !user) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-8 font-medium">
          <ArrowRight className="w-4 h-4" />
          חזרה לעמוד הבית
        </Link>

        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="w-7 h-7" />
              יצירת חוזה השכרה
            </CardTitle>
            <p className="text-orange-100 mt-2">מלא את הפרטים ליצירת חוזה דיגיטלי לשוכר</p>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Product Summary */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">פרטי המוצר</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">שם המוצר:</span>
                    <p className="text-gray-900">{product.title}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">מחיר ליום:</span>
                    <p className="text-orange-600 font-bold">{product.price_per_day}₪</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">פיצוי במקרה נזק:</span>
                    <p className="text-red-600 font-bold">{product.damage_compensation_amount}₪</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">בעלים:</span>
                    <p className="text-gray-900">{product.owner_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Tenant Details */}
              <div className="space-y-6">
                <h3 className="font-bold text-xl flex items-center gap-3 text-gray-900">
                  <UserIcon className="w-6 h-6 text-orange-600" />
                  פרטי השוכר
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tenant_name" className="text-sm font-semibold">שם מלא *</Label>
                    <Input
                      id="tenant_name"
                      value={formData.tenant_name}
                      onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                      className="border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tenant_id" className="text-sm font-semibold">תעודת זהות *</Label>
                    <Input
                      id="tenant_id"
                      value={formData.tenant_id}
                      onChange={(e) => handleInputChange('tenant_id', e.target.value)}
                      placeholder="123456789"
                      className="border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="space-y-6">
                <h3 className="font-bold text-xl flex items-center gap-3 text-gray-900">
                  <Calendar className="w-6 h-6 text-orange-600" />
                  תקופת השכירות
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-semibold">תאריך התחלה *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-semibold">תאריך סיום *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      className="border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              {formData.start_date && formData.end_date && (
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <CircleDollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">סיכום עלויות</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">מספר ימים:</span>
                        <span className="font-bold text-lg">{calculateDays()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">עלות השכירות:</span>
                        <span className="font-bold text-lg text-orange-600">{calculateTotal()}₪</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-gray-700">פיצוי במקרה נזק:</span>
                        <span className="font-bold text-lg text-red-600">{product.damage_compensation_amount}₪</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Notice */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 mb-2">בטיחות ואבטחה מלאה</h3>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          החוזה יישלח אוטומטית לאימייל שלך
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          כל הפרטים מוצפנים ומאובטחים
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          תהליך פשוט ללא בירוקרטיה מסובכת
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl py-6 shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "יוצר חוזה..." : "צור חוזה"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}