import { Mail, Inbox, Send, Settings, Star, FileText, Trash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="w-64 h-screen bg-black text-white flex flex-col fixed">
      <div className="p-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="w-6 h-6" />
          AI Email
        </h1>
      </div>
      <nav className="flex-1 space-y-1">
        <SidebarItem 
          icon={<Inbox />} 
          label="Inbox" 
          active={currentPath === '/inbox'} 
          onClick={() => navigate('/inbox')}
        />
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-2 px-6 py-2 text-white hover:bg-white/10"
          onClick={() => navigate('/compose')}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Compose</span>
        </Button>
        <SidebarItem 
          icon={<Star />} 
          label="Starred" 
          active={currentPath === '/starred'} 
          onClick={() => navigate('/starred')}
        />
        <SidebarItem 
          icon={<Send />} 
          label="Sent" 
          active={currentPath === '/sent'} 
          onClick={() => navigate('/sent')}
        />
        <SidebarItem 
          icon={<FileText />} 
          label="Drafts" 
          active={currentPath === '/drafts'} 
          onClick={() => navigate('/drafts')}
        />
        <SidebarItem 
          icon={<Trash />} 
          label="Trash" 
          active={currentPath === '/trash'} 
          onClick={() => navigate('/trash')}
        />
      </nav>
      <div className="p-4 border-t border-white/10">
        <SidebarItem 
          icon={<Settings />} 
          label="Settings" 
          active={false} 
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

const SidebarItem = ({ 
  icon, 
  label, 
  active,
  onClick 
}: { 
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-6 py-2 cursor-pointer hover:bg-white/10 transition-colors",
        active && "bg-white/10"
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default Sidebar;
