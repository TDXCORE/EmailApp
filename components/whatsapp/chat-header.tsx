import React from 'react';
import { Video, Phone, Search, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  contactName: string;
  // Add other contact info props like avatar if available later
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ contactName }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Contact Info */}
      <div className="flex items-center gap-3">
        {/* Placeholder for Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800">{contactName}</h3>
          {/* Optional: Add online status or last seen */}
          {/* <p className="text-sm text-gray-500">Online</p> */}
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        <button
          title="Video call"
          className="p-2 hover:bg-gray-200 rounded-full text-gray-600 focus:outline-none"
        >
          <Video className="w-5 h-5" />
        </button>
        <button
          title="Voice call"
          className="p-2 hover:bg-gray-200 rounded-full text-gray-600 focus:outline-none"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          title="Search in conversation"
          className="p-2 hover:bg-gray-200 rounded-full text-gray-600 focus:outline-none"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          title="Menu"
          className="p-2 hover:bg-gray-200 rounded-full text-gray-600 focus:outline-none"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader; 