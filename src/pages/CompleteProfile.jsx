import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import Logo from '@/components/Logo';

export default function CompleteProfile() {
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in, redirect to home to trigger login
        window.location.href = createPageUrl('Home');
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !/^\d{10}$/.test(phone)) {
      alert('אנא הזן מספר טלפון תקין בן 10 ספרות (לדוגמה: 0501234567)');
      return;
    }

    setIsSubmitting(true);
    try {
      await User.updateMyUserData({ phone });
      alert('הפרופיל עודכן בהצלחה!');
      window.location.href = createPageUrl('Home');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('שגיאה בעדכון הפרופיל. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Card className="max-w-md w-full shadow-2xl border-orange-200">
        <CardHeader className="text-center">
          <Logo size="large" showText={true} className="mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">כמעט סיימנו!</CardTitle>
          <p className="text-gray-600">כדי להשלים את ההרשמה, יש להזין מספר טלפון.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="font-semibold text-gray-700 mb-2 block">מספר טלפון</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-1234567"
                  required
                  className="pl-10 text-left"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">המספר ישמש לאימות ויהיה זמין למנהלת המערכת בלבד.</p>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg py-5 shadow-md"
            >
              {isSubmitting ? 'שומר...' : 'המשך לאפליקציה'}
              <ArrowRight className="mr-2 w-5 h-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}