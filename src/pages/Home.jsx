
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { locations } from "@/components/locations";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationSearch from "@/components/LocationSearch";
import {
  Search,
  MapPin,
  Calendar,
  CircleDollarSign,
  Package,
  Filter,
  Truck,
  Shield,
  Zap,
  Users,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Logo from "@/components/Logo";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [selectedLocation, setSelectedLocation] = useState("הכל");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  const categories = ["הכל", "וילות ודירות", "צילום", "הגברה ותאורה", "מסיבות ואירועים", "שמלות נשף", "חליפות גברים", "אופנה וביגוד", "תינוקות וילדים", "קמפינג וטיולים", "ספורט וכושר", "כלים", "אלקטרוניקה", "תחבורה", "ריהוט", "הפעלות", "אחר"];

  useEffect(() => {
    loadData();
  }, []);

  // Effect to set maxPrice and initial priceRange based on loaded products
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price_per_day).filter(p => p != null && !isNaN(p));
      if (prices.length > 0) {
        const calculatedMax = Math.max(...prices);
        let newMaxPrice;
        
        // מגדיר טווח מחיר מקסימלי עד 9999
        if (calculatedMax <= 100) {
          newMaxPrice = 500;
        } else if (calculatedMax <= 500) {
          newMaxPrice = 1000;
        } else if (calculatedMax <= 1000) {
          newMaxPrice = 2000;
        } else if (calculatedMax <= 5000) {
          newMaxPrice = 5000;
        } else {
          newMaxPrice = 9999;
        }
        
        setMaxPrice(newMaxPrice);
        // מחיר התחלה תמיד 0, רק המקסימום משתנה
        setPriceRange([0, newMaxPrice]);
      } else {
        setMaxPrice(9999);
        setPriceRange([0, 9999]);
      }
    } else {
      setMaxPrice(9999);
      setPriceRange([0, 9999]);
    }
  }, [products]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedLocation, priceRange]);

  const loadData = async () => {
    setIsLoading(true);
    setIsCheckingAuth(true);

    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const productsData = await Product.list("-created_date");
      setProducts(productsData.filter(p => p.is_available));
    } catch (error) {
      console.log("User not logged in");
      setUser(null);
    }

    setIsCheckingAuth(false);
    setIsLoading(false);
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "הכל") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (selectedLocation !== "הכל") {
      filtered = filtered.filter(product => product.location === selectedLocation);
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price_per_day != null &&
      !isNaN(product.price_per_day) &&
      product.price_per_day >= priceRange[0] &&
      product.price_per_day <= priceRange[1]
    );

    setFilteredProducts(filtered);
  };

  const handleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const formatPriceLabel = (value) => {
    if (value === 0) {
      return "0₪";
    }
    if (value === maxPrice && maxPrice >= 1000) {
      return `${value}+₪`;
    }
    return `${value}₪`;
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Logo size="large" showText={false} className="mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Welcome screen (for demo purposes or if not logged in)
  if (!user || showWelcomeScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <Logo size="xl" showText={false} className="mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              ברוכים הבאים ל-<span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Rant.GO</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              הפלטפורמה הבטוחה והפשוטה להשכרת מוצרים בין אנשים פרטיים.
              חוזים דיגיטליים, חתימה אוטומטית באפליקציה, ללא בירוקרטיה מסובכת.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-orange-200 hover:shadow-lg transition-all duration-300 hover:border-orange-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">בטיחות מלאה</h3>
                <p className="text-gray-600 text-sm">חוזים דיגיטליים מאובטחים עם חתימה דיגיטלית</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-all duration-300 hover:border-orange-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">מהיר ופשוט</h3>
                <p className="text-gray-600 text-sm">תהליך השכרה במספר קליקים בלבד</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-all duration-300 hover:border-orange-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">קהילה אמינה</h3>
                <p className="text-gray-600 text-sm">משתמשים מאומתים ומערכת בטוחה</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card className="max-w-md mx-auto border-orange-200 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold">בוא נתחיל!</CardTitle>
              <p className="text-orange-100 mt-2">התחבר והתחל להשכיר או להשאיל היום</p>
            </CardHeader>
            <CardContent className="p-6">
              {user ? (
                <Button
                  onClick={() => setShowWelcomeScreen(false)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-lg shadow-lg"
                >
                  כניסה לאפליקציה
                </Button>
              ) : (
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-lg shadow-lg"
                >
                  התחבר עכשיו
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Welcome Screen Button */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900">גלה מוצרים להשכרה</h1>
            <Button
              variant="outline"
              onClick={() => setShowWelcomeScreen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              צפה במסך הפתיחה
            </Button>
          </div>
          <p className="text-xl text-gray-600">מצא בדיוק מה שאתה צריך או השכר את המוצרים שלך</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-6 p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="חפש מוצרים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-12 py-4 text-lg border-orange-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="font-semibold mb-2 block text-center md:text-right">קטגוריה</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <LocationSearch
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder="חפש אזור..."
              label="אזור"
            />
            
            <div>
              <Label className="font-semibold mb-4 block text-center md:text-right">
                מחיר ליום: {formatPriceLabel(priceRange[0])} - {formatPriceLabel(priceRange[1])}
              </Label>
              <div className="px-2">
                <Slider
                  dir="ltr"
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={maxPrice}
                  min={0}
                  step={maxPrice <= 100 ? 10 : maxPrice <= 500 ? 25 : maxPrice <= 1000 ? 50 : 100}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0₪</span>
                  <span>{formatPriceLabel(maxPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse border-orange-100">
                <div className="h-48 bg-orange-100 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-orange-100 rounded mb-2"></div>
                  <div className="h-3 bg-orange-100 rounded mb-4"></div>
                  <div className="h-8 bg-orange-100 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">אין מוצרים להצגה</h3>
            <p className="text-gray-500">נסה לשנות את החיפוש או הפילטרים</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-100 hover:border-orange-200 group">
                <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-white" />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-orange-600 border-0 shadow-sm">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{product.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span>{product.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CircleDollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">{product.price_per_day}₪ ליום</span>
                    </div>
                  </div>

                  <Link to={createPageUrl(`Product?id=${product.id}`)}>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">
                      השכר עכשיו
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto border-orange-200 shadow-lg">
            <CardContent className="p-10">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">יש לך מוצרים להשכרה?</h2>
              <p className="text-gray-600 mb-8 text-lg">הוסף את המוצרים שלך לפלטפורמה והתחל להרוויח כבר היום</p>
              <Link to={createPageUrl("AddProduct")}>
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 text-lg shadow-lg">
                  הוסף מוצר להשכרה
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
