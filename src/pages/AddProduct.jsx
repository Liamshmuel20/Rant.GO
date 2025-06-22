
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { locations } from "@/components/locations";
import LocationSearch from "@/components/LocationSearch";
import {
  ArrowRight,
  Package,
  Upload,
  Check,
  Image as ImageIcon,
  Info,
  DollarSign,
  Shield,
  AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AddProduct() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_per_day: "",
    damage_compensation_amount: "",
    category: "",
    location: "",
    image_url: "",
    owner_name: "",
    owner_id: "",
    owner_phone: "",
    owner_bank_name: "",
    owner_bank_branch: "",
    owner_bank_account: "",
    commission_agreement: false
  });

  const categories = ["וילות ודירות", "צילום", "הגברה ותאורה", "מסיבות ואירועים", "שמלות נשף", "חליפות גברים", "אופנה וביגוד", "תינוקות וילדים", "קמפינג וטיולים", "ספורט וכושר", "כלים", "אלקטרוניקה", "תחבורה", "ריהוט", "הפעלות", "אחר"];

  const banks = ["בנק הפועלים", "בנק לאומי", "בנק דיסקונט", "בנק מזרחי טפחות", "בנק יהב", "בנק אוצר החיל", "בנק ירושלים", "הבנק הבינלאומי", "בנק איגוד"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        owner_name: currentUser.full_name || ""
      }));
    } catch (error) {
      console.log("User not logged in");
      navigate(createPageUrl("Home"));
      return;
    }

    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        image_url: file_url
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("שגיאה בהעלאת התמונה. אנא נסה שוב.");
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.commission_agreement) {
      alert("יש לאשר את תנאי העמלה כדי להמשיך");
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        damage_compensation_amount: parseFloat(formData.damage_compensation_amount),
        is_available: true
      };

      const product = await Product.create(productData);
      alert("המוצר נוסף בהצלחה!");
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error creating product:", error);
      alert("שגיאה בהוספת המוצר. אנא נסה שוב.");
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

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium">
          <ArrowRight className="w-4 h-4" />
          חזרה לעמוד הבית
        </Link>

        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6" />
              הוספת מוצר להשכרה
            </CardTitle>
            <p className="text-orange-100 mt-2">מלא את הפרטים להוספת המוצר שלך לפלטפורמה</p>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  פרטי המוצר
                </h3>

                <div>
                  <Label htmlFor="title">שם המוצר *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="לדוגמה: מקדחה חשמלית"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">תיאור המוצר *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="תאר את המוצר, מצבו והשימושים שלו"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">קטגוריה *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <LocationSearch
                    value={formData.location || ""}
                    onChange={(value) => handleInputChange('location', value === "הכל" ? "" : value)}
                    placeholder="חפש מיקום..."
                    label="מיקום *"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  תמחור
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_per_day">מחיר להשכרה ליום (₪) *</Label>
                    <Input
                      id="price_per_day"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.price_per_day}
                      onChange={(e) => handleInputChange('price_per_day', e.target.value)}
                      placeholder="50"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="damage_compensation_amount">סכום פיצוי על נזק (₪) *</Label>
                    <Input
                      id="damage_compensation_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.damage_compensation_amount}
                      onChange={(e) => handleInputChange('damage_compensation_amount', e.target.value)}
                      placeholder="500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">פרטי הבעלים</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="owner_name">שם מלא *</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_id">תעודת זהות *</Label>
                    <Input
                      id="owner_id"
                      value={formData.owner_id}
                      onChange={(e) => handleInputChange('owner_id', e.target.value)}
                      placeholder="123456789"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="owner_phone">מספר טלפון *</Label>
                  <Input
                    id="owner_phone"
                    value={formData.owner_phone}
                    onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                    placeholder="050-1234567"
                    required
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-lg">פרטי חשבון בנק</h3>
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>למה אנחנו צריכים את פרטי החשבון שלך?</strong><br/>
                    כדי שנוכל להעביר לך את הכסף מהשכרות (פחות עמלה של 10%). התשלום יתבצע ישירות לחשבון הבנק שלך תוך 24-48 שעות מאישור השכרה.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="owner_bank_name">בנק *</Label>
                    <Select value={formData.owner_bank_name} onValueChange={(value) => handleInputChange('owner_bank_name', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר בנק" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="owner_bank_branch">מספר סניף *</Label>
                    <Input
                      id="owner_bank_branch"
                      value={formData.owner_bank_branch}
                      onChange={(e) => handleInputChange('owner_bank_branch', e.target.value)}
                      placeholder="123"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_bank_account">מספר חשבון *</Label>
                    <Input
                      id="owner_bank_account"
                      value={formData.owner_bank_account}
                      onChange={(e) => handleInputChange('owner_bank_account', e.target.value)}
                      placeholder="1234567"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Commission Agreement */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-orange-900 mb-2">תנאי עמלה - חשוב לקריאה!</h3>
                      <div className="text-sm text-orange-800 space-y-2 mb-4">
                        <p>• <strong>מכל השכרה שתתבצע, נגבה עמלה של 10% מהסכום הכולל</strong></p>
                        <p>• העמלה מכסה: עיבוד תשלומים, ביטוח העסקה, תמיכה טכנית ושירות לקוחות</p>
                        <p>• לדוגמה: אם המוצר שלך מושכר ב-100₪ ליום, תקבל 90₪ ו-10₪ יועברו כעמלה</p>
                        <p>• התשלום יועבר לחשבון הבנק שלך תוך 24-48 שעות מאישור השכרה</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="commission_agreement"
                          checked={formData.commission_agreement}
                          onCheckedChange={(checked) => handleInputChange('commission_agreement', checked)}
                        />
                        <Label htmlFor="commission_agreement" className="text-sm font-semibold cursor-pointer">
                          אני מאשר/ת ומסכים/ה לתנאי העמלה של 10% מכל השכרה *
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">תמונת המוצר</h3>

                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {isUploading ? (
                        "מעלה..."
                      ) : (
                        <>
                          <Upload className="w-4 h-4 ml-2" />
                          העלה תמונה
                        </>
                      )}
                    </label>
                  </Button>

                  {formData.image_url && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span>תמונה הועלתה</span>
                    </div>
                  )}
                </div>

                {formData.image_url && (
                  <div className="mt-4">
                    <img
                      src={formData.image_url}
                      alt="תמונת המוצר"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl py-6 shadow-lg"
                disabled={isSubmitting || !formData.commission_agreement}
              >
                {isSubmitting ? "מוסיף מוצר..." : "הוסף מוצר לפלטפורמה"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
