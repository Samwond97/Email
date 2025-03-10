import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Inbox = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleGmailConnect = () => {
    // This is where you would implement Gmail OAuth
    // For now, we'll just toggle the state
    setIsConnected(true);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Inbox</h1>
          
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <Mail className="w-16 h-16 text-gray-400" />
              <h2 className="text-xl font-medium text-gray-600">Connect to Gmail</h2>
              <p className="text-gray-500 text-center max-w-md">
                Connect your Gmail account to see your emails and start composing new messages.
              </p>
              <Button 
                onClick={handleGmailConnect}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Connect to Gmail
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500 text-center py-8">
                No emails yet. They will appear here once you receive them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
