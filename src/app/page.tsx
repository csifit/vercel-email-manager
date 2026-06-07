"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [activeItem, setActiveItem] = useState("create");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("user");
  const router = useRouter();
  const supabase = createClient();

  // Fetch user and role on load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email || "");

      // Fetch user role from profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
      } else if (profile) {
        console.log("User role fetched:", profile.role); // Check browser console!
        setUserRole(profile.role);
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderContent = () => {
    if (activeItem === "admin" && userRole === "admin") {
      return <AdminView />;
    }
    if (activeItem === "create") return <CreateEmailView copyToClipboard={copyToClipboard} copiedField={copiedField} />;
    if (activeItem === "smtp") return <SMTPDetailsView copyToClipboard={copyToClipboard} copiedField={copiedField} />;
    if (activeItem === "profile") return <ProfileView email={userEmail} role={userRole} />;
    
    return <PlaceholderView title={activeItem.charAt(0).toUpperCase() + activeItem.slice(1)} desc="Feature under active development." />;
  };

  return (
    <div className="flex h-screen overflow-hidden font-mono bg-[#0d1117] text-white">
      {/* --- SIDEBAR --- */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 bg-[#161b22] border-r border-gray-800 flex flex-col`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between h-16">
          {sidebarOpen && <h1 className="text-lg font-bold tracking-tight">Maild</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-gray-700 text-gray-400 transition-colors">
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            {sidebarOpen && <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">Menu</h2>}
            <ul className="space-y-1">
              {userRole === "admin" && (
                <li>
                  <button onClick={() => setActiveItem("admin")} className={`w-full flex items-center p-2 rounded transition-colors ${activeItem === "admin" ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent"}`}>
                    <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                    {sidebarOpen && <span className="ml-3 text-sm">Super Admin</span>}
                  </button>
                </li>
              )}
              <li>
                <button onClick={() => setActiveItem("create")} className={`w-full flex items-center p-2 rounded transition-colors ${activeItem === "create" ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent"}`}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                  {sidebarOpen && <span className="ml-3 text-sm">Create Email</span>}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveItem("smtp")} className={`w-full flex items-center p-2 rounded transition-colors ${activeItem === "smtp" ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent"}`}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                  {sidebarOpen && <span className="ml-3 text-sm">SMTP Details</span>}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveItem("profile")} className={`w-full flex items-center p-2 rounded transition-colors ${activeItem === "profile" ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent"}`}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                  {sidebarOpen && <span className="ml-3 text-sm">My Profile</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="text-sm text-white truncate">{userEmail}</p>
              <p className="text-xs text-purple-400 uppercase">{userRole}</p>
            </div>
          )}
          <button onClick={handleSignOut} className="w-full flex items-center justify-center p-2 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-800 transition-colors text-sm">
            {sidebarOpen ? "Sign Out" : "🚪"}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
}

// --- 1. CREATE EMAIL VIEW (The working form) ---
function CreateEmailView({ copyToClipboard, copiedField }: any) {
  const [domain, setDomain] = useState("");
  const [prefix, setPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch('/api/create-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, prefix, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create email');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-green-400">✅ Email Created Successfully!</h2>
        <p className="text-gray-400 mb-6 text-sm">Your mailbox <code className="text-blue-300">{result.email}</code> is ready. Add these DNS records to your registrar.</p>
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Required DNS Records</h3>
          {result.dnsRecords.map((rec: any, idx: number) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
              <span className="text-sm font-medium text-gray-400 mb-1 sm:mb-0">{rec.type} Record ({rec.name})</span>
              <div className="flex items-center space-x-3">
                <code className="bg-[#0d1117] px-3 py-1.5 rounded text-sm text-blue-300 border border-gray-700 min-w-[200px] text-right break-all">{rec.value}</code>
                <button onClick={() => copyToClipboard(rec.value, `dns_${idx}`)} className={`px-3 py-1.5 text-xs rounded transition-all ${copiedField === `dns_${idx}` ? "bg-green-600/20 text-green-400 border border-green-600/50" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"}`}>
                  {copiedField === `dns_${idx}` ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setResult(null)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Create Another</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white">Create Email Address</h2>
      <p className="text-gray-400 mb-8 text-sm">Provision a new mailbox on your domain via MXroute.</p>
      <form onSubmit={handleSubmit} className="bg-[#161b22] border border-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Domain Name</label>
          <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourdomain.com" required className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Email Prefix</label>
          <div className="flex">
            <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="admin" required className="flex-1 bg-[#0d1117] border border-gray-700 rounded-l px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-3 py-2 text-gray-500">@{domain || 'domain.com'}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" required className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {error && <div className="p-3 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-sm">{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Provisioning..." : "Create Mailbox"}
        </button>
      </form>
    </div>
  );
}

// --- 2. SUPER ADMIN VIEW ---
function AdminView() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-purple-400">Super Admin Dashboard</h2>
      <p className="text-gray-400 mb-8 text-sm">Monitor platform traffic, manage users, and review MXroute provisioning logs.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-white">1</p>
        </div>
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-1">Active Domains</h3>
          <p className="text-3xl font-bold text-white">1</p>
        </div>
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-1">API Calls (24h)</h3>
          <p className="text-3xl font-bold text-green-400">12</p>
        </div>
      </div>
    </div>
  );
}

// --- 3. PROFILE VIEW ---
function ProfileView({ email, role }: { email: string, role: string }) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white">My Profile</h2>
      <p className="text-gray-400 mb-8 text-sm">Manage your account details and subscription.</p>
      <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
          <div className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white">{email}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Account Role</label>
          <div className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-purple-400 font-bold uppercase">{role}</div>
        </div>
        <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm">
          Update Password (Coming Soon)
        </button>
      </div>
    </div>
  );
}

// --- 4. SMTP DETAILS VIEW ---
function SMTPDetailsView({ copyToClipboard, copiedField }: any) {
  const smtpData = {
    incomingServer: "arrow.mxrouting.net",
    imapPort: "993",
    pop3Port: "995",
    outgoingServer: "arrow.mxrouting.net",
    smtpPortSSL: "465",
    smtpPortSTARTTLS: "587",
    username: "admin@maild.dev",
    password: "••••••••••••••••",
    authMethod: "Normal Password",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white">SMTP & IMAP Configuration</h2>
      <p className="text-gray-400 mb-8 text-sm">Use these details to configure your email client.</p>
      <div className="bg-[#161b22] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Authentication</h3>
          <DetailRow label="Username (Full Email)" value={smtpData.username} fieldName="user" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="Password" value={smtpData.password} fieldName="pass" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="Authentication Method" value={smtpData.authMethod} fieldName="auth" copyToClipboard={copyToClipboard} copiedField={copiedField} />
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4">Incoming Mail Server (IMAP)</h3>
          <DetailRow label="Server Hostname" value={smtpData.incomingServer} fieldName="in_host" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="IMAP Port (SSL/TLS)" value={smtpData.imapPort} fieldName="imap" copyToClipboard={copyToClipboard} copiedField={copiedField} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, fieldName, copyToClipboard, copiedField }: any) {
  const isCopied = copiedField === fieldName;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
      <span className="text-sm font-medium text-gray-400 mb-1 sm:mb-0">{label}</span>
      <div className="flex items-center space-x-3">
        <code className="bg-[#0d1117] px-3 py-1.5 rounded text-sm text-blue-300 border border-gray-700 min-w-[120px] text-right">{value}</code>
        <button onClick={() => copyToClipboard(value, fieldName)} className={`px-3 py-1.5 text-xs rounded transition-all ${isCopied ? "bg-green-600/20 text-green-400 border border-green-600/50" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"}`}>
          {isCopied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function PlaceholderView({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm max-w-md">{desc}</p>
      <div className="mt-8 px-4 py-2 bg-[#161b22] border border-gray-800 rounded-full">
        <p className="text-xs text-gray-500">Feature under construction 🚧</p>
      </div>
    </div>
  );
}