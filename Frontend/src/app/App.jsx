import "./App.css";
import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MonacoBinding } from "y-monaco";
import { SocketIOProvider } from "y-socket.io";
import * as Y from "yjs";

function App() {
  const [username, setUsername] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("username") || "";
  });
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);

  const editorRef = useRef(null);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const handleMonacoMount = (editor, monaco) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    );
  };

  useEffect(() => {
    if (!username) return;

    const provider = new SocketIOProvider("http://localhost:3000", "monaco", ydoc, {
      autoConnect: true
    });
    const states = Array.from(provider.awareness.getStates().values());
    setUsers(states.filter(state => state.user && state.user.username).map(state => state?.user));

    provider.on("status", (event) => {
      setConnected(event.status === "connected");
      console.log("Connection status:", event.status);
    });

    provider.awareness.setLocalStateField("user", {
      username: username,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16)
    });

    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values());
      const filtered = states
        .filter(state => state.user && state.user.username)
        .map(state => state.user);

      console.log(filtered)
      setUsers(filtered)
    });

    const handleBeforeUnload = (e) => { provider.awareness.setLocalStateField("user", null) };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      provider.disconnect();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };

  }, [yText, ydoc, username]);

  const handleJoin = (e) => {
    e.preventDefault();
    setUsername(e.target.username.value);
    window.history.pushState({}, "", `?username=${e.target.username.value}`)
  }

  if (!username) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6 shadow-lg shadow-blue-500/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H5a3.5 3.5 0 00-3.5 3.5v7a3.5 3.5 0 003.5 3.5h5.5a3.5 3.5 0 003.5-3.5v-7a3.5 3.5 0 00-3.5-3.5z" />
                <path d="M14.5 5a3.5 3.5 0 013.5 3.5v7a3.5 3.5 0 01-3.5 3.5h-2" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">CodeSync</h1>
            <p className="text-slate-400 text-sm">Real-time collaborative code editor</p>
          </div>

          <form className="space-y-4" onSubmit={handleJoin}>
            <div className="relative">
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            <button className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95">
              Enter Session
            </button>
          </form>

          <p className="text-slate-500 text-xs text-center mt-8">
            Join a collaborative session and code in real-time with your team
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md flex items-center px-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H5a3.5 3.5 0 00-3.5 3.5v7a3.5 3.5 0 003.5 3.5h5.5a3.5 3.5 0 003.5-3.5v-7a3.5 3.5 0 00-3.5-3.5z" />
                <path d="M14.5 5a3.5 3.5 0 013.5 3.5v7a3.5 3.5 0 01-3.5 3.5h-2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">CodeSync</h2>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs text-slate-300">{connected ? 'Connected' : 'Offline'}</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <span className="text-xs font-medium text-slate-300">{username}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Users Sidebar */}
        <aside className="w-72 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 flex flex-col overflow-hidden">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Connected Users</h3>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
          </div>

          <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
            {users.map((user, index) => (
              <li
                key={index}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors duration-200 group"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-slate-900 transition-all duration-200 group-hover:scale-125"
                  style={{
                    backgroundColor: user.color,
                    boxShadow: `0 0 12px ${user.color}40`
                  }}
                ></div>
                <span className="text-sm text-slate-300 truncate">{user.username}</span>
              </li>
            ))}
          </ul>

          {users.length === 0 && (
            <div className="flex items-center justify-center h-32 text-slate-500 text-xs text-center">
              Waiting for collaborators...
            </div>
          )}

          {/* User Count Badge */}
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 w-full justify-center">
              <div className="flex gap-1">
                {users.slice(0, 3).map((user, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded-full ring-2 ring-slate-900"
                    style={{ backgroundColor: user.color }}
                  ></div>
                ))}
              </div>
              <span className="text-xs text-slate-400">{users.length} {users.length === 1 ? 'User' : 'Users'}</span>
            </div>
          </div>
        </aside>

        {/* Editor Section */}
        <section className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden flex flex-col">
          <div className="h-12 border-b border-slate-800/50 px-6 flex items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">JavaScript Editor</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              defaultValue="// Welcome to CodeSync!\n// Start typing to see real-time collaboration\n// All changes are synchronized across connected users\n\nconst greeting = (name) => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greeting('CodeSync'));"
              theme="vs-dark"
              onMount={handleMonacoMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default App