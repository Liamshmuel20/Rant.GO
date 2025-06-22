import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Contract } from "@/api/entities";
import { ChatMessage } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  ChevronLeft,
  Loader2,
  Inbox
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

export default function MyChats() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const allContracts = await Contract.list("-updated_date");
      const userContracts = allContracts.filter(c => 
        (c.landlord_email === currentUser.email || c.tenant_email === currentUser.email) && c.status === "פעיל"
      );

      const allMessages = await ChatMessage.list("-created_date");

      const lastMessagesMap = new Map();
      for (const message of allMessages) {
        if (!lastMessagesMap.has(message.contract_id)) {
          lastMessagesMap.set(message.contract_id, message);
        }
      }

      const chatList = userContracts.map(contract => ({
        ...contract,
        lastMessage: lastMessagesMap.get(contract.id)
      })).sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date);
      });

      setChats(chatList);

    } catch (error) {
      console.error("Error loading chats:", error);
    }
    setIsLoading(false);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">טוען את השיחות שלך...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <MessageSquare className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">השיחות שלי</h1>
            <p className="text-gray-600">כל ההתכתבויות שלך במקום אחד</p>
          </div>
        </div>

        <Card className="shadow-lg border-orange-200">
          <CardContent className="p-4">
            {chats.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">אין שיחות פעילות</h3>
                <p className="text-gray-500">כאשר תתחילו שיחה לגבי חוזה, היא תופיע כאן</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map(chat => {
                  const otherUser = user?.email === chat.landlord_email ? chat.tenant_name : chat.landlord_name;
                  const lastMessageText = chat.lastMessage ? 
                    (chat.lastMessage.sender_email === user?.email ? `אתה: ${chat.lastMessage.message}` : chat.lastMessage.message) 
                    : "אין עדיין הודעות";
                  
                  return (
                    <Link to={createPageUrl(`Chat?contractId=${chat.id}`)} key={chat.id}>
                      <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-orange-50 transition-colors duration-200 cursor-pointer">
                        <Avatar className="h-12 w-12 border-2 border-orange-100">
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${otherUser}`} />
                          <AvatarFallback>{otherUser.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-gray-800">{otherUser}</p>
                            {chat.lastMessage && (
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(chat.lastMessage.created_date), { addSuffix: true, locale: he })}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 truncate">{chat.product_description}</p>
                          <p className="text-sm text-gray-500 truncate">{lastMessageText}</p>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}