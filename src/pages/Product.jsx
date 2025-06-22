
import React, { useState, useEffect } from "react";
import { Product as ProductEntity } from "@/api/entities";
import { Review } from "@/api/entities";
import { User } from "@/api/entities";
import { Contract } from "@/api/entities"; // New import
import { RentalRequest } from "@/api/entities"; // New import
import { Notification } from "@/api/entities"; // New import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, ArrowLeft, Star, Send, User as UserIcon, Edit, MapPin, AlertTriangle, Info } from "lucide-react"; // New icons
import StarRating from "@/components/StarRating";
import { Alert, AlertDescription } from "@/components/ui/alert"; // New imports for alerts
import { Label } from "@/components/ui/label"; // New import
import { Input } from "@/components/ui/input"; // New import
import { format } from "date-fns"; // New import for date formatting

export default function ProductPage() {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [occupiedDates, setOccupiedDates] = useState([]); // New state for occupied dates
  const [isLoading, setIsLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // New states for rental request form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Generic submitting state for rental request

  const productId = new URLSearchParams(window.location.search).get('id');
  const navigate = useNavigate();

  useEffect(() => {
    if (productId) {
      loadProductData();
    } else {
      navigate(createPageUrl("Home")); // Redirect if no product ID
    }
  }, [productId, navigate]);

  const loadProductData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, products, reviewsData, contracts] = await Promise.all([
        User.me().catch(() => null), // Catch error if not logged in
        ProductEntity.list(),
        Review.list(),
        Contract.list() // Load all contracts
      ]);

      setUser(currentUser);

      const foundProduct = products.find(p => p.id === productId);

      if (!foundProduct) {
        alert("מוצר לא נמצא");
        navigate(createPageUrl("Home"));
        return;
      }
      setProduct(foundProduct);

      const productReviews = reviewsData.filter(r => r.product_id === productId);
      setReviews(productReviews);

      // Get occupied dates from active contracts for this product
      const activeContracts = contracts.filter(c =>
        c.product_id === productId &&
        c.status === 'פעיל'
      );

      const occupied = [];
      activeContracts.forEach(contract => {
        const start = new Date(contract.start_date);
        const end = new Date(contract.end_date);

        // Add all dates in the range to occupied array
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          occupied.push(new Date(date));
        }
      });
      setOccupiedDates(occupied);

    } catch (error) {
      console.error("Error loading product data:", error);
      alert("שגיאה בטעינת פרטי המוצר");
      navigate(createPageUrl("Home"));
    }
    setIsLoading(false);
  };

  // Function to check if a date is occupied
  const isDateOccupied = (date) => {
    return occupiedDates.some(occupiedDate =>
      occupiedDate.toDateString() === date.toDateString()
    );
  };

  // Function to check if selected date range conflicts with occupied dates
  const hasDateConflict = () => {
    if (!startDate || !endDate) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return false; // Invalid range, no conflict check needed yet

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (isDateOccupied(date)) {
        return true;
      }
    }
    return false;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newReview.comment.trim() || newReview.rating === 0) {
      alert("אנא דרג והוסף תגובה.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await Review.create({
        product_id: productId,
        user_name: user.full_name,
        user_email: user.email,
        rating: newReview.rating,
        comment: newReview.comment
      });
      setNewReview({ rating: 0, comment: '' });
      loadProductData(); // Reload reviews and other product data
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("שגיאה בשליחת התגובה.");
    }
    setIsSubmittingReview(false);
  };

  // New handleSubmit for rental request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("עליך להתחבר כדי לשלוח בקשת השכרה");
      try {
        await User.login(); // Try to log in
        // Page will reload after successful login, no more actions needed here for this submission
      } catch (loginError) {
        console.error("Login failed:", loginError);
        alert("ההתחברות נכשלה. אנא נסה שוב.");
      }
      return;
    }

    // Check for date conflicts before submitting
    if (hasDateConflict()) {
      alert("התאריכים שבחרת חופפים עם הזמנה קיימת. אנא בחר תאריכים אחרים.");
      return;
    }

    if (!user.phone) {
      alert("עליך להשלים את הפרופיל שלך (מספר טלפון) לפני שתוכל לבקש להשכיר מוצרים.");
      navigate(createPageUrl("CompleteProfile"));
      return;
    }

    if (!startDate || !endDate) {
      alert("אנא בחר תאריכי התחלה וסיום.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    if (start < today) {
      alert("לא ניתן לבחור תאריך התחלה בעבר.");
      return;
    }
    if (start >= end) {
      alert("תאריך הסיום חייב להיות אחרי תאריך ההתחלה.");
      return;
    }
    if (!tenantId.trim()) {
        alert("אנא הזן תעודת זהות.");
        return;
    }


    setIsSubmitting(true);

    try {
      const requestData = {
        product_id: productId,
        product_title: product.title,
        landlord_email: product.created_by,
        tenant_name: user.full_name,
        tenant_id: tenantId,
        tenant_email: user.email,
        tenant_phone: user.phone,
        start_date: startDate,
        end_date: endDate,
        message: message
      };

      await RentalRequest.create(requestData);

      await Notification.create({
        user_email: product.created_by,
        title: "בקשת השכרה חדשה!",
        message: `${user.full_name} מעוניין לשכור את ${product.title} בתאריכים ${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
        type: "message",
        related_id: productId,
        action_url: createPageUrl("RentalRequests")
      });

      alert("בקשת ההשכרה נשלחה בהצלחה! תקבל עדכון כשהבעלים יגיב.");
      navigate(createPageUrl("Home"));

    } catch (error) {
      console.error("Error creating rental request:", error);
      alert("שגיאה בשליחת הבקשה. אנא נסה שוב.");
    }

    setIsSubmitting(false);
  };

  const handleLogin = async () => {
    try {
      await User.login();
      loadProductData(); // Reload data after successful login
    } catch (error) {
      console.error("Login failed:", error);
      alert("ההתחברות נכשלה. אנא נסה שוב.");
    }
  };

  if (isLoading) {
    return <div className="p-6">טוען...</div>;
  }

  if (!product) {
    // This case should be handled by navigation in useEffect, but as a fallback
    return <div className="p-6">מוצר לא נמצא.</div>;
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const isOwner = user && product && user.email === product.created_by;

  const minDateForCalendar = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          חזרה לכל המוצרים
        </Link>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left side - Image & Description */}
          <div className="space-y-6">
            <Card className="shadow-lg border-orange-200">
              <CardContent className="p-0">
                <img src={product.image_url || 'https://via.placeholder.com/500x300.png?text=No+Image'} alt={product.title} className="w-full h-80 object-cover rounded-t-lg"/>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-orange-200">
              <CardHeader>
                <CardTitle>תיאור המוצר</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                <div className="flex items-center gap-2 text-gray-600 mt-4">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>{product.location}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Actions & Reviews */}
          <div className="space-y-6">
            {/* Product Info Card */}
            <Card className="shadow-lg border-orange-200">
              <CardHeader>
                <CardTitle className="text-3xl font-bold">{product.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <UserIcon className="w-4 h-4" />
                  <span>הועלה על ידי: {product.owner_name}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">{product.price_per_day}₪</p>
                    <p className="text-gray-500">מחיר להשכרה ליום</p>
                  </div>
                  {/* The original "בקש להשכיר" button removed from here */}
                </div>
              </CardContent>
            </Card>

            {/* Rental Request Form Card */}
            <Card className="shadow-lg border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  בקשת השכרה
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOwner ? (
                  <div className="text-center py-8">
                    <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">זהו המוצר שלך</h3>
                    <p className="text-gray-500 mb-4">אינך יכול להשכיר את המוצר של עצמך.</p>
                  </div>
                ) : user ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date conflict warning */}
                    {hasDateConflict() && (
                      <Alert className="border-red-200 bg-red-50 text-red-800">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                          התאריכים שבחרת חופפים עם הזמנה קיימת. אנא בחר תאריכים אחרים.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Show occupied dates info */}
                    {occupiedDates.length > 0 && (
                      <Alert className="border-orange-200 bg-orange-50 text-orange-800">
                        <Info className="h-4 w-4 text-orange-600" />
                        <AlertDescription>
                          <strong>תאריכים תפוסים:</strong> יש הזמנות פעילות למוצר זה.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="tenant_id">תעודת זהות *</Label>
                      <Input
                        id="tenant_id"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        placeholder="123456789"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">תאריך התחלה *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={minDateForCalendar}
                          required
                          className={hasDateConflict() ? "border-red-300 bg-red-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">תאריך סיום *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate || minDateForCalendar}
                          required
                          className={hasDateConflict() ? "border-red-300 bg-red-50" : ""}
                        />
                      </div>
                    </div>

                    {/* Date range picker with occupied dates visual */}
                    {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">סיכום תקופת השכירות:</h4>
                        <div className="text-sm space-y-1">
                          <p>מתאריך: {format(new Date(startDate), 'dd/MM/yyyy')}</p>
                          <p>עד תאריך: {format(new Date(endDate), 'dd/MM/yyyy')}</p>
                          <p>משך זמן: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} ימים</p>
                          <p className="font-semibold text-green-600">
                            עלות כוללת: {((Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1) * product.price_per_day).toFixed(2)}₪
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="message">הודעה למשכיר (אופציונלי)</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="הוסף הודעה אישית למשכיר..."
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      disabled={isSubmitting || hasDateConflict()}
                    >
                      {isSubmitting ? "שולח בקשה..." : "שלח בקשת השכרה"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">נדרשת התחברות</h3>
                    <p className="text-gray-500 mb-4">כדי לשלוח בקשת השכרה עליך להתחבר תחילה</p>
                    <Button onClick={handleLogin} className="bg-orange-600 hover:bg-orange-700">
                      התחבר עכשיו
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>


            <Card className="shadow-lg border-orange-200">
              <CardHeader>
                <CardTitle>ביקורות ({reviews.length})</CardTitle>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={averageRating} interactive={false} />
                    <span className="text-sm font-bold">{averageRating.toFixed(1)} מתוך 5</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Write a review */}
                  {user && !isOwner && (
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                       <h3 className="font-semibold">כתוב ביקורת</h3>
                       <StarRating rating={newReview.rating} setRating={(r) => setNewReview(prev => ({...prev, rating: r}))} />
                       <Textarea
                         placeholder="ספר לנו על החוויה שלך..."
                         value={newReview.comment}
                         onChange={(e) => setNewReview(prev => ({...prev, comment: e.target.value}))}
                       />
                       <Button type="submit" disabled={isSubmittingReview}>
                         {isSubmittingReview ? "שולח..." : "שלח ביקורת"}
                       </Button>
                    </form>
                  )}
                  {/* Display reviews */}
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">אין עדיין ביקורות למוצר זה.</p>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {reviews.map(review => (
                      <div key={review.id} className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${review.user_name}`} />
                          <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{review.user_name}</p>
                          <StarRating rating={review.rating} interactive={false} />
                          <p className="text-gray-600 mt-1">{review.comment}</p>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
