import { useState, useEffect } from "react";
import axios from "axios";
import { UserButton, useUser, SignIn } from "@clerk/clerk-react";
import {
  Code2, Search, Share2, FileCode, Menu, Terminal, Trash2, Plus, Lock, X
} from "lucide-react";
import UploadManager from "./components/UploadManager";
import CodeEditor from "./components/CodeEditor";
import CreateFileModal from "./components/CreateFileModel";

function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  
  // Responsive State
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Guest / Password State
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [filePassword, setFilePassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [targetFileId, setTargetFileId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle Resize for Responsive Layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false); // Auto-close on mobile
      else setSidebarOpen(true); // Auto-open on desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Check URL on Load (Guest Access)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('fileId');

    if (sharedId) {
      setIsGuestMode(true);
      setTargetFileId(sharedId);
      setSidebarOpen(false); // Hide sidebar for guests
      attemptAccess(sharedId, "");
    }
  }, []);

  const attemptAccess = async (id, pwd) => {
      try {
          // UPDATED URL
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/file/${id}/access`, {
              password: pwd
          });
          setSelectedFile(data);
          setNeedsPassword(false);
          setPasswordError("");
      } catch (error) {
          if (error.response?.status === 401) {
              setNeedsPassword(true);
              setPasswordError(pwd ? "Incorrect Password" : "");
          } else {
              alert("File not found or error occurred");
          }
      }
  };

  // 2. Fetch User's Files
  const fetchFiles = async () => {
    if (!user) return;
    try {
      // UPDATED URL
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/files?userId=${user.id}`);
      setFiles(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isLoaded && user && !isGuestMode) fetchFiles();
  }, [isLoaded, user, isGuestMode]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (isMobile) setSidebarOpen(false); // Close sidebar on mobile after clicking
  };

  // Actions
  const shareFile = (e, file) => {
    e.stopPropagation();
    const link = `${window.location.origin}/?fileId=${file._id}`;
    navigator.clipboard.writeText(link);
    alert(`Share link copied!\n${link}`);
  };

  const deleteFile = async (e, fileId) => {
    e.stopPropagation();
    if (!window.confirm("Delete file?")) return;
    try {
      // UPDATED URL
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/file/${fileId}`);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      if (selectedFile?._id === fileId) setSelectedFile(null);
    } catch (error) { alert("Error deleting"); }
  };

  // --- PASSWORD SCREEN ---
  if (needsPassword) {
      return (
          <div className="h-screen w-screen bg-[#0d1117] flex items-center justify-center text-gray-300 p-4">
              <div className="bg-[#161b22] p-8 rounded-lg border border-[#30363d] w-full max-w-md text-center shadow-xl">
                  <div className="flex justify-center mb-4">
                      <div className="bg-blue-900/30 p-4 rounded-full text-blue-400">
                          <Lock size={32} />
                      </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Protected File</h2>
                  <p className="text-sm text-gray-500 mb-6">Enter password to view this file.</p>
                  <input type="password" placeholder="Enter Password"
                      className="w-full bg-[#0d1117] border border-[#30363d] p-2 rounded text-white mb-2 focus:border-blue-500 outline-none"
                      value={filePassword} onChange={(e) => setFilePassword(e.target.value)} />
                  {passwordError && <p className="text-red-400 text-xs mb-4">{passwordError}</p>}
                  <button onClick={() => attemptAccess(targetFileId, filePassword)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition">Unlock File</button>
              </div>
          </div>
      );
  }

  // --- LOGIN SCREEN ---
  if (!isGuestMode && isLoaded && !isSignedIn) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-[#0d1117]">
              <SignIn />
          </div>
      );
  }

  // --- MAIN APP ---
  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-gray-300 font-sans overflow-hidden">
      
      {/* Navbar */}
      <nav className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-3">
          {!isGuestMode && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition md:hidden">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <div className="flex items-center gap-2 text-white font-bold tracking-tight">
             <Code2 className="text-blue-500" />
             <span className="hidden sm:inline">DevSync</span>
             <span className="sm:hidden">DevSync</span>
          </div>
        </div>
        {isSignedIn ? <UserButton /> : <span className="text-xs text-gray-500 bg-[#21262d] px-2 py-1 rounded-full">Guest Mode</span>}
      </nav>

      <div className="flex flex-1 min-h-0 relative">
        
        {/* --- SIDEBAR (Responsive) --- */}
        {!isGuestMode && (
          <>
            {/* Mobile Backdrop */}
            {isMobile && sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar Container */}
            <div className={`
                bg-[#0d1117] border-r border-[#30363d] flex flex-col transition-all duration-300 ease-in-out
                ${isMobile ? 'fixed inset-y-0 left-0 z-30 w-72 h-full shadow-2xl' : 'w-64 relative'}
                ${!sidebarOpen && isMobile ? '-translate-x-full' : 'translate-x-0'}
                ${!sidebarOpen && !isMobile ? 'hidden' : 'flex'}
            `}>
                
                {/* Search */}
                <div className="p-3 mt-14 md:mt-0"> {/* Margin top on mobile for Navbar */}
                  <div className="flex items-center bg-[#21262d] border border-[#30363d] px-2 py-2 rounded focus-within:border-blue-500">
                      <Search size={16} className="text-gray-400"/>
                      <input className="bg-transparent ml-2 outline-none text-sm w-full text-white" 
                          placeholder="Search files..." onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                
                {/* File List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filteredFiles.map((file) => (
                    <div key={file._id} onClick={() => handleFileSelect(file)}
                      className={`group px-4 py-3 flex justify-between items-center cursor-pointer border-l-2 text-sm transition-colors
                        ${selectedFile?._id === file._id ? "bg-[#161b22] border-blue-500 text-white" : "border-transparent text-gray-400 hover:bg-[#161b22]"}`}>
                      <div className="flex gap-3 items-center truncate">
                        <FileCode size={18} className="text-blue-400"/> 
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => shareFile(e, file)} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Share2 size={14}/></button>
                          <button onClick={(e) => deleteFile(e, file._id)} className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-[#30363d] bg-[#161b22] flex flex-col gap-3">
                    <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-md text-sm font-bold shadow-lg shadow-blue-900/20">
                        <Plus size={18} /> New File
                    </button>
                    <UploadManager onUploadSuccess={fetchFiles} />
                </div>
            </div>
          </>
        )}

        {/* --- MAIN EDITOR --- */}
        <div className="flex-1 flex flex-col bg-[#0d1117] w-full min-w-0">
          {selectedFile ? (
            <CodeEditor
              key={selectedFile._id}
              fileId={selectedFile._id}
              fileName={selectedFile.name}
              fileUrl={selectedFile.url}
            />
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 select-none p-6 text-center">
              <div className="w-20 h-20 bg-[#161b22] rounded-full flex items-center justify-center mb-6 ring-1 ring-[#30363d]">
                 {isGuestMode ? <Lock size={32} className="opacity-50" /> : <Terminal size={32} className="opacity-50" />}
              </div>
              <h2 className="text-xl font-semibold text-gray-300 mb-2">{isGuestMode ? "File Access" : "DevSync IDE"}</h2>
              <p className="text-sm text-gray-500">{isGuestMode ? "File loaded." : "Select a file from the menu to start coding."}</p>
            </div>
          )}
        </div>
      </div>

      <CreateFileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onFileCreated={fetchFiles} 
      />
    </div>
  );
}

export default App;