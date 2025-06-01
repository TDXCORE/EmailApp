// Add 'use client' directive
'use client';

import { useWhatsAppRealtime, WhatsAppRealtimeMessage } from '@/lib/hooks/use-whatsapp-realtime';
import { useParams } from 'next/navigation'; // Use useParams for dynamic routes in client components
import { useEffect, useRef } from 'react';

// You might need to define or import UI components for displaying messages
// Example: MessageBubble component
const MessageBubble = ({ message, isSent }: { message: WhatsAppRealtimeMessage, isSent: boolean }) => {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg p-2 ${isSent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
        {message.content.text?.body || '...'}
      </div>
    </div>
  );
};

export default function ConversationPage() {
  // Note: useParams is typically used in client components.
  // This page will need 'use client' directive if using hooks like useParams.
  // Alternatively, if this is a server component, waId should be received via props.
  // For simplicity and using useWhatsAppRealtime, let's assume client component for now.
  // Add 'use client' if necessary based on your project structure.

  const params = useParams();
  const waId = params.waId as string; // Get the contact ID from the URL

  const { messages } = useWhatsAppRealtime(waId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll to bottom when messages update

  if (!waId) {
    return <div>Loading conversation...</div>; // Or handle error
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-semibold mb-4">Conversation with {waId}</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          // Assuming 'from_number' helps determine if the message is sent or received
          // You'll need to compare msg.from_number with your WhatsApp Business phone number ID
          <MessageBubble key={msg.id} message={msg} isSent={msg.from_number !== waId} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Basic message input area - sending logic not included yet */}
      <div className="mt-4">
        <input type="text" placeholder="Type a message..." className="w-full p-2 border rounded" />
        <button className="mt-2 p-2 bg-blue-500 text-white rounded">Send</button>
      </div>
    </div>
  );
} 