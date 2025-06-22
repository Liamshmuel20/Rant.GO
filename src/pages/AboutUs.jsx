import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Zap, 
  Users, 
  FileText, 
  Star, 
  Heart,
  CheckCircle,
  ArrowRight,
  Target,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AboutUs() {
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <div className="text-white font-bold text-3xl">R</div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            קצת על <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Rant.GO</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            כולנו מכירים את זה – יש לנו בבית מצלמה ששכבה שנה בארון, אוהל שטח ששימש אותנו לטיול אחד, או אפילו מקדחה שהייתה בשימוש… פעם אחת.
            ובאותו הזמן, מישהו אחר בעיר בדיוק צריך את הפריט הזה – ליום, לסופ"ש, לפרויקט.
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-12 border-orange-200 shadow-lg">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Rent.GO נולדה בדיוק מהמקום הזה</h2>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  אנחנו חיים בעידן של שיתוף – של קיימות, של חשיבה חכמה.
                  במקום לקנות – משכירים. במקום לאחסן – משתפים.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Rent.GO מחברת בין אנשים – לא רק בין משתמשים לאפליקציה, אלא בין צרכים להזדמנויות, בין קהילה לקהילה.
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4 text-orange-700">למה לא לקנות חדש?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    חוסך כסף רב
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    שומר על הסביבה
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    לא צריך מקום אחסון
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    פתרון מיידי וזמני
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">האפליקציה מאפשרת לכל אחד</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-orange-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">לפרסם בקלות</h3>
                <p className="text-sm text-gray-600">כל פריט שזמין להשכרה – עם תמונה, תיאור, ומחיר</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">לחפש בקלות</h3>
                <p className="text-sm text-gray-600">לפי קטגוריות, אזור מגורים, או טווח מחירים</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">לשוחח ולתאם</h3>
                <p className="text-sm text-gray-600">לשוחח עם משכירים, לתאם, ולהשכיר בלי בלגן – הכל במקום אחד</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vision */}
        <Card className="mb-12 border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-green-900">החזון שלנו פשוט</h2>
            </div>
            <p className="text-xl text-green-700 max-w-3xl mx-auto leading-relaxed">
              להפוך כל פריט רדום – למשאב פעיל.<br/>
              לחסוך כסף, לשמור על הסביבה, ולבנות קהילה של שיתוף.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-orange-200 shadow-xl">
          <CardContent className="p-10 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">אז למה אתם מחכים?</h2>
              <div className="text-lg text-gray-700 mb-8 space-y-2">
                <p>
                  אם יש לך משהו מיותר – <span className="font-bold text-orange-600">תפרסם</span>
                </p>
                <p>
                  ואם אתה צריך משהו זמני – <span className="font-bold text-orange-600">תחפש</span>
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg mb-6">
                <p className="text-lg font-semibold text-orange-800">
                  Rent.GO – כי לפעמים, להשכיר זה פשוט יותר חכם.
                </p>
              </div>
              <Link to={createPageUrl("Home")}>
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 text-lg shadow-lg">
                  <ArrowRight className="w-5 h-5 ml-2" />
                  בואו נתחיל!
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}