
import React, { useState, useEffect } from "react";
import { Contract } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Calendar,
  User as UserIcon,
  Building,
  Mail,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function MyContracts() {
  const [contracts, setContracts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const allContracts = await Contract.list("-created_date");
      // Filter contracts where user is either tenant or landlord
      const userContracts = allContracts.filter(contract => 
        contract.tenant_email === currentUser.email || 
        contract.created_by === currentUser.email
      );
      
      setContracts(userContracts);
    } catch (error) {
      console.error("Error loading contracts:", error);
    }

    setIsLoading(false);
  };

  const getFilteredContracts = (filter) => {
    switch (filter) {
      case "tenant":
        return contracts.filter(c => c.tenant_email === user?.email);
      case "landlord":
        return contracts.filter(c => c.created_by === user?.email);
      case "sent":
        return contracts.filter(c => c.status === "נשלח");
      default:
        return contracts;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "פעיל":
        return "bg-green-500";
      case "ממתין לחתימת משכיר":
        return "bg-blue-500";
      case "ממתין לחתימת שוכר":
        return "bg-yellow-500";
      case "טיוטה":
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">החוזים שלי</h1>
            <p className="text-gray-600 mt-1">ניהול כל החוזים שלך במקום אחד</p>
          </div>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזרה לבית
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">כל החוזים ({contracts.length})</TabsTrigger>
            <TabsTrigger value="tenant">אני שוכר ({getFilteredContracts("tenant").length})</TabsTrigger>
            <TabsTrigger value="landlord">אני משכיר ({getFilteredContracts("landlord").length})</TabsTrigger>
            <TabsTrigger value="sent">נשלחו ({getFilteredContracts("sent").length})</TabsTrigger>
          </TabsList>

          {["all", "tenant", "landlord", "sent"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {getFilteredContracts(tab).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">אין חוזים להצגה</h3>
                    <p className="text-gray-500">
                      {tab === "all" && "טרם יצרת או השתתפת בחוזים"}
                      {tab === "tenant" && "טרם שכרת מוצרים"}
                      {tab === "landlord" && "טרם השכרת מוצרים"}
                      {tab === "sent" && "אין חוזים שנשלחו"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {getFilteredContracts(tab).map((contract) => (
                    <Card key={contract.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{contract.product_description}</h3>
                              <Badge 
                                className={`${getStatusColor(contract.status)} text-white`}
                              >
                                {contract.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>שוכר: {contract.tenant_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>משכיר: {contract.landlord_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {format(new Date(contract.start_date), "dd/MM")} - {format(new Date(contract.end_date), "dd/MM")}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 text-sm text-gray-500">
                              פיקדון: {contract.deposit_amount}₪ | 
                              נוצר: {format(new Date(contract.created_date), "dd/MM/yyyy")}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link to={createPageUrl(`Contract?id=${contract.id}`)}>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 ml-2" />
                                צפה בחוזה
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
