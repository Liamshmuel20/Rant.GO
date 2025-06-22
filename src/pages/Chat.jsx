
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Contract } from "@/api/entities";
import { Product } from "@/api/entities"; // Import Product entity
import { ChatMessage } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RentalStatusTracker from '../components/RentalStatusTracker';
import {
  Send,
  Loader2,
  ArrowRight,
  Info,
  Phone,
  Mail
} from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [product, setProduct] = useState(null); // State for product details
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const contractId = new URLSearchParams(window.location.search).get('contractId');

  useEffect(() => {
    if (!contractId) {
      navigate(createPageUrl("MyChats"));
      return;
    }
    loadChatData();
  }, [contractId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const contracts = await Contract.list();
      const currentContract = contracts.find(c => c.id === contractId);

      if (!currentContract) {
        navigate(createPageUrl("MyChats"));
        return;
      }
      setContract(currentContract);

      const products = await Product.list();
      const currentProduct = products.find(p => p.id === currentContract.product_id);
      setProduct(currentProduct);

      await loadMessages(currentContract);

    } catch (error) {
      console.error("Error loading chat:", error);
    }
    setIsLoading(false);
  };

  const loadMessages = async (currentContract) => {
    const allMessages = await ChatMessage.filter({ contract_id: currentContract.id }, 'created_date');
    setMessages(allMessages);
  };

  const sendAdminNotification = async (messageData, contract) => {
    try {
      const adminEmail = "liampo10806@gmail.com";
      const senderName = user.email === contract.landlord_email ? contract.landlord_name : contract.tenant_name;
      
      await SendEmail({
        to: adminEmail,
        subject: `הודעה חדשה ב-Rant.GO בנוגע למוצר: ${contract.product_description}`,
        body: `
          <p>הודעה חדשה נשלחה בשיחה בין ${contract.landlord_name} לבין ${contract.tenant_name}.</p>
          <p><strong>השולח:</strong> ${senderName}</p>
          <p><strong>ההודעה:</strong> ${messageData.message}</p>
          <p>כדי לצפות בשיחה המלאה, יש להיכנס לדף הבקרה.</p>
        `
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageData = {
      contract_id: contract.id,
      sender_email: user.email,
      receiver_email: user.email === contract.landlord_email ? contract.tenant_email : contract.landlord_email,
      message: newMessage
    };

    try {
      await ChatMessage.create(messageData);
      setNewMessage("");
      await loadMessages(contract);
      await sendAdminNotification(messageData, contract);
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };
  
  const otherUser = contract ? (user?.email === contract.landlord_email ? {name: contract.tenant_name, email: contract.tenant_email} : {name: contract.landlord_name, email: contract.landlord_email}) : null;
  const isChatActive = contract?.status === 'פעיל';

  if (isLoading || !contract || !user) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <Link to={createPageUrl("MyChats")} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-4 font-medium">
          <ArrowRight className="w-4 h-4" />
          חזרה לכל השיחות
        </Link>

        {/* Header with contact info for active contracts */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">{contract?.product_description}</h1>
                <p className="text-sm text-gray-600">
                  {contract?.tenant_name} ↔ {contract?.landlord_name}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-shrink-0">
                  <RentalStatusTracker contractStatus={contract.status} paymentStatus={null} />
                </div>
                {contract?.status === 'פעיל' && (
                  <div className="text-sm bg-green-50 p-3 rounded-lg flex-shrink-0">
                    <h3 className="font-semibold text-green-800 mb-1">פרטי קשר:</h3>
                    {user?.email === contract.tenant_email ? (
                      <p className="text-green-700 flex items-center gap-1"><Phone className="w-3 h-3"/>משכיר: {contract.landlord_name} - {contract.landlord_phone || 'לא זמין'}</p>
                    ) : (
                      <p className="text-green-700 flex items-center gap-1"><Phone className="w-3 h-3"/>שוכר: {contract.tenant_name} - {contract.tenant_phone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1 flex flex-col">
          <CardContent className="p-6 flex-1 overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_email === user.email ? 'justify-end' : ''}`}>
                {msg.sender_email !== user.email && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${otherUser.name}`} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender_email === user.email ? 'bg-orange-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.sender_email === user.email ? 'text-orange-100' : 'text-gray-500'}`}>
                    {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true, locale: he })}
                  </p>
                </div>
                {msg.sender_email === user.email && (
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.full_name}`} />
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </CardContent>
          <CardFooter className="p-4 border-t">
            {!isChatActive ? (
               <div className="w-full text-center p-4 bg-gray-100 rounded-lg">
                 <Info className="w-5 h-5 mx-auto mb-2 text-gray-500" />
                 <p className="text-sm text-gray-600">הצ'אט יפתח לתיאומים לאחר אישור התשלום על ידי מנהלת המערכת.</p>
               </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="כתוב הודעה..."
                  autoComplete="off"
                />
                <Button type="submit" disabled={isSending}>
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
