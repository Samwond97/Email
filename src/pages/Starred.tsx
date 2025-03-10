import Sidebar from "@/components/Sidebar";

const Starred = () => {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-gray-800">Starred</h1>
      </div>
    </div>
  );
};

export default Starred;
