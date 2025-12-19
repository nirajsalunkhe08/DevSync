import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { Play, Terminal as TerminalIcon, Loader2, Save, Download } from 'lucide-react';
import axios from 'axios';

const CodeEditor = ({ fileId, fileName, fileUrl }) => {
    const editorRef = useRef(null);
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('Terminal Ready...');
    const [isRunning, setIsRunning] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Language Detection
    useEffect(() => {
        if (!fileName) return;
        const ext = fileName.split('.').pop();
        const map = { js: 'javascript', py: 'python', java: 'java', cpp: 'cpp', c: 'c', html: 'html', css: 'css' };
        setLanguage(map[ext] || 'plaintext');
    }, [fileName]);

    // 1. Force Load Content Immediately (Ensures no blank screen on refresh)
    useEffect(() => {
        const loadContent = async () => {
            if (!fileUrl || !editorRef.current) return;
            
            try {
                setIsFetching(true);
                const response = await axios.get(`${fileUrl}?t=${Date.now()}`);
                const content = typeof response.data === 'string' 
                    ? response.data 
                    : JSON.stringify(response.data, null, 2);
                
                // Only set value if editor is empty to avoid interrupting a live session
                if (editorRef.current.getValue() === '') {
                    editorRef.current.setValue(content);
                }
            } catch (error) {
                console.error("Failed to load file:", error);
                setOutput("Error loading file content from cloud.");
            } finally {
                setIsFetching(false);
            }
        };

        loadContent();
    }, [fileUrl, fileId]);

    // 2. Setup Real-Time Collaboration with Awareness (Cursors)
async function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;

        // 1. FIRST: Fetch the latest content from the cloud
        if (fileUrl) {
            try {
                const response = await axios.get(`${fileUrl}?t=${Date.now()}`);
                const cloudContent = typeof response.data === 'string' 
                    ? response.data 
                    : JSON.stringify(response.data, null, 2);
                
                // Set the initial content before binding Yjs
                editor.setValue(cloudContent);
            } catch (err) {
                console.error("Initial load failed:", err);
            }
        }

        // 2. SECOND: Now bind the WebSocket for live updates
        const wsProviderUrl = window.location.hostname === 'localhost'
            ? 'ws://localhost:1234'
            : 'wss://devsync-socket.onrender.com';

        try {
            const ydoc = new Y.Doc();
            const provider = new WebsocketProvider(wsProviderUrl, `devsync-room-${fileId}`, ydoc);
            const ytext = ydoc.getText('monaco');
            
            const awareness = provider.awareness;
            awareness.setLocalStateField('user', {
                name: 'User ' + Math.floor(Math.random() * 100),
                color: '#' + Math.floor(Math.random()*16777215).toString(16)
            });

            // Bind after the initial value is set to keep lines aligned
            const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), awareness);
        } catch (err) {
            console.error("WebSocket connection failed:", err);
        }
    }

    const saveCode = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        const content = editorRef.current.getValue();

        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/file/${fileId}`, {
                content: content
            });
            setOutput("File saved successfully to Cloud! ☁️\n");
        } catch (error) {
            console.error(error);
            setOutput("Error saving file. Check console.\n");
        } finally {
            setIsSaving(false);
        }
    };

    const downloadCode = () => {
        if (!editorRef.current) return;
        const content = editorRef.current.getValue();
        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setOutput("File downloaded to your computer! ⬇️\n");
    };

    const runCode = async () => {
        if (!editorRef.current) return;
        const sourceCode = editorRef.current.getValue();
        setIsRunning(true);
        setOutput("Running code...\n");

        const runtimeMap = {
            'javascript': { language: 'javascript', version: '18.15.0' },
            'python': { language: 'python', version: '3.10.0' },
            'java': { language: 'java', version: '15.0.2' },
            'c': { language: 'c', version: '10.2.0' },
            'cpp': { language: 'c++', version: '10.2.0' }
        };

        const runtime = runtimeMap[language];
        if (!runtime) {
            setOutput(`Error: Execution not supported for ${language} yet.`);
            setIsRunning(false);
            return;
        }

        try {
            await saveCode(); 
            const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language: runtime.language,
                version: runtime.version,
                files: [{ content: sourceCode }]
            });
            const { run } = response.data;
            setOutput(run.output || "No output returned.");
        } catch (error) {
            setOutput("Error running code: Failed to connect to compiler.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0d1117]">
            <div className="h-12 bg-[#010409] flex items-center justify-between px-4 border-b border-[#30363d] shrink-0">
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-[#0d1117] border border-[#30363d] text-sm text-gray-200 rounded flex items-center gap-2">
                        <span className="font-mono text-xs opacity-50">{language}</span>
                        <span className="font-bold">{fileName}</span>
                    </div>
                    {isFetching && <Loader2 size={14} className="animate-spin text-blue-400"/>}
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={downloadCode} className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] px-3 py-1.5 rounded text-xs font-bold transition">
                        <Download size={14} /> <span className="hidden sm:inline">Download</span>
                    </button>
                    <button onClick={saveCode} disabled={isSaving} className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-50">
                        {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />}
                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button onClick={runCode} disabled={isRunning} className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-50">
                        {isRunning ? <Loader2 size={14} className="animate-spin"/> : <Play size={14} fill="white" />}
                        <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run'}</span>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0"> 
                <div className="flex-1 relative">
                    <Editor
                        height="100%"
                        width="100%"
                        language={language}
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: '"Fira Code", monospace', automaticLayout: true, padding: { top: 16, bottom: 16 } }}
                    />
                </div>
                <div style={{ height: '200px' }} className="bg-[#010409] border-t border-[#30363d] flex flex-col shrink-0">
                    <div className="h-8 bg-[#0d1117] border-b border-[#30363d] flex items-center px-4 gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider shrink-0">
                        <TerminalIcon size={14} /> <span>Terminal / Output</span>
                    </div>
                    <div className="flex-1 p-3 font-mono text-sm text-gray-300 overflow-auto custom-scrollbar whitespace-pre-wrap">{output}</div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;