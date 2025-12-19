import { useState } from 'react';
import { X, FilePlus, Key } from 'lucide-react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react";

const CreateFileModal = ({ isOpen, onClose, onFileCreated }) => {
    const { user } = useUser();
    const [fileName, setFileName] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [password, setPassword] = useState(''); // State for Password
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!fileName) return alert("Please enter a file name");
        setLoading(true);

        try {
            // UPDATED URL
            await axios.post(`${import.meta.env.VITE_API_URL}/api/file/create`, {
                userId: user.id,
                fileName,
                language,
                password // Send the password (can be empty)
            });
            onFileCreated(); // Refresh the file list
            onClose(); // Close the modal
            
            // Reset fields
            setFileName('');
            setPassword('');
        } catch (error) {
            console.error(error);
            alert("Failed to create file");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-lg w-[90%] max-w-md shadow-xl">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold flex items-center gap-2">
                        <FilePlus size={20} className="text-blue-500"/> Create New File
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={20}/>
                    </button>
                </div>

                {/* 1. Filename Input */}
                <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Filename</label>
                    <input 
                        type="text" 
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="e.g. main"
                        className="w-full bg-[#0d1117] border border-[#30363d] text-white p-2 rounded focus:border-blue-500 outline-none placeholder-gray-600"
                    />
                </div>

                {/* 2. Language Select */}
                <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Language</label>
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] text-white p-2 rounded focus:border-blue-500 outline-none cursor-pointer"
                    >
                        <option value="javascript">JavaScript (.js)</option>
                        <option value="python">Python (.py)</option>
                        <option value="java">Java (.java)</option>
                        <option value="cpp">C++ (.cpp)</option>
                        <option value="php">PHP (.php)</option>
                        <option value="html">HTML (.html)</option>
                    </select>
                </div>

                {/* 3. Password Input (New) */}
                <div className="mb-6">
                    <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Optional Password</label>
                    <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded px-2 focus-within:border-blue-500 transition">
                        <Key size={14} className="text-gray-500 mr-2"/>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave empty for public access"
                            className="w-full bg-transparent text-white p-2 outline-none placeholder-gray-600 text-sm"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 border-t border-[#30363d] pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-400 hover:text-white text-sm transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreate}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50 transition shadow-lg shadow-blue-900/20"
                    >
                        {loading ? 'Creating...' : 'Create File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateFileModal;