import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Mail, Bell, Shield, Palette, User } from "lucide-react";

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-8">Settings</h1>
          
          <div className="space-y-8">
            {/* Account Settings */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Settings
              </h2>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">Display Name</label>
                  <Input className="mt-1" placeholder="Your display name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Signature</label>
                  <Input className="mt-1" placeholder="Your email signature" />
                </div>
              </div>
            </section>

            {/* Email Settings */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Settings
              </h2>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Send read receipts</p>
                    <p className="text-sm text-gray-500">Let others know when you've read their emails</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-reply</p>
                    <p className="text-sm text-gray-500">Set up automatic replies when you're away</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </h2>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Get notified when you receive new emails</p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications} 
                  />
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </h2>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-factor authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </section>

            {/* Appearance */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </h2>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-gray-500">Toggle dark mode on or off</p>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode} 
                  />
                </div>
              </div>
            </section>

            <div className="pt-4">
              <Button className="bg-black hover:bg-gray-800 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
