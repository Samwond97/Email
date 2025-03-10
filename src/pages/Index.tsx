import Sidebar from "@/components/Sidebar";
import EmailComposer from "@/components/EmailComposer";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <EmailComposer />
    </div>
  );
};

export default Index;
