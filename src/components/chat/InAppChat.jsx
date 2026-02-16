import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  MessageCircle, 
  Send, 
  X,
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function InAppChat({ escrowId, escrowTitle, currentUser, otherPartyEmail, otherPartyName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const chatRoomId = escrowId;

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat', chatRoomId],
    queryFn: () => base44.entities.ChatMessage.filter({ escrow_id: chatRoomId }, '-created_date', 50),
    enabled: isOpen
  });

  useEffect(() => {
    if (chatMessages.length > 0) {
      setMessages([...chatMessages].reverse());
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data.escrow_id === chatRoomId) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, chatRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatRoomId] });
    }
  });

  const handleSend = () => {
    if (!message.trim() || !currentUser) return;

    sendMutation.mutate({
      escrow_id: chatRoomId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name || currentUser.email,
      content: message.trim()
    });

    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-purple-200 text-purple-600 hover:bg-purple-50"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Chat
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-100">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <span className="truncate">{escrowTitle}</span>
          </SheetTitle>
          <p className="text-sm text-gray-500">
            Chat with {otherPartyName || otherPartyEmail}
          </p>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.sender_email === currentUser?.email;
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <p className="text-xs text-gray-500 mb-1 ml-1">
                        {msg.sender_name || msg.sender_email}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                      {msg.created_date && formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          {currentUser ? (
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">
              Please log in to send messages
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}