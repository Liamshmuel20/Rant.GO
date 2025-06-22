import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ContactUs() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">צור קשר</h1>
          <p className="text-lg text-gray-600">נשמח לעמוד לשירותך בכל שאלה או בקשה.</p>
        </div>

        <Card className="shadow-lg border-orange-200 max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">בואו נדבר!</h2>
            <p className="text-gray-600 mb-6">
              יש לך שאלה? בעיה טכנית? רעיון לשיפור? 
              <br />
              כתבו לנו ונחזור אליכם בהקדם האפשרי.
            </p>
            
            <div className="bg-orange-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-800 mb-2">כתובת מייל:</h3>
              <a 
                href="mailto:liampo10806@gmail.com" 
                className="text-orange-600 hover:underline font-semibold text-lg"
              >
                liampo10806@gmail.com
              </a>
            </div>
            
            <Button 
              asChild
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              <a href="mailto:liampo10806@gmail.com">
                <Mail className="w-4 h-4 ml-2" />
                שלח מייל עכשיו
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}