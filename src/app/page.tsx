"use client";
import { useState } from "react";
import Link from "next/link"; // <--- ADDED: Import Next.js Link

// Menu Structure
const menuItems = {
  clients: [
    { id: "create", label: "Create Email Address" },
    { id: "send", label: "Send Mail" },
    { id: "inbox", label: "Inbox" },
    { id: "outbox", label: "Outbox" },
  ],
  developer: [
    { id: "smtp", label: "SMTP Details" },
  ],
};

export default function Home() {
  const [activeItem, setActiveItem] = useState("create"); // Default to create for testing
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderContent = () => {
    switch (activeItem) {
      case "create": return <CreateEmailView copyToClipboard={copyToClipboard} copiedField={copiedField} />;
      case "send": return <PlaceholderView title="Send Mail" desc="Interface to compose and send emails." />;
      case "inbox": return <PlaceholderView title="Inbox" desc="List of received emails." />;
      case "outbox": return <PlaceholderView title="Outbox" desc="List of sent emails." />;
      case "smtp": return <SMTPDetailsView copyToClipboard={copyToClipboard} copiedField={copiedField} />;
      default: return <CreateEmailView copyToClipboard={copyToClipboard} copiedField={copiedField} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-mono">
      {/* --- SIDEBAR --- */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 bg-[#161b22] border-r border-gray-800 flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between h-16">
          {sidebarOpen && (
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-white tracking-tight">Maild</h1>
              {/* <--- ADDED: Link to Pricing Page */}
              <Link href="/pricing" className="text-xs text-gray-400 hover:text-blue-400 transition-colors border border-gray-700 px-2 py-1 rounded">
                Pricing
              </Link>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-gray-700 text-gray-400 transition-colors" title="Toggle Sidebar">
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            {sidebarOpen && <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">Clients</h2>}
            <ul className="space-y-1">
              {menuItems.clients.map((item) => (
                <li key={item.id}>
                  <button onClick={() => setActiveItem(item.id)} className={`w-full flex items-center p-2 rounded transition-colors ${activeItem === item.id ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent"}`}>
                    <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                    {sidebarOpen && <span className="ml-3 text-sm">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {sidebarOpen && <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">Developer Details</h2>}
            <ul className="space-y-1">
              {menuItems.developer.map((item) => (
                <li key={item.id}>
                  <button onClick={() => setActiveItem(item.id)} className={`w-full flex items-center p-2 rounded transition-colors ${activeItem === item.id ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent"}`}>
                    <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                    {sidebarOpen && <span className="ml-3 text-sm">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0d1117]">
        {renderContent()}
      </main>
    </div>
  );
}

// --- CREATE EMAIL COMPONENT ---
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
        <p className="text-gray-400 mb-6 text-sm">Your mailbox <code className="text-blue-300">{result.email}</code> is ready. To start receiving emails, you must add the following DNS records to your domain registrar.</p>
        
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

        <button onClick={() => setResult(null)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Create Another Email
        </button>
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

// --- SMTP DETAILS COMPONENT ---
function SMTPDetailsView({ copyToClipboard, copiedField }: any) {
  const smtpData = {
    incomingServer: "arrow.mxrouting.net", 
    imapPort: "993", pop3Port: "995",
    outgoingServer: "arrow.mxrouting.net",
    smtpPortSSL: "465", smtpPortSTARTTLS: "587",
    username: "admin@maild.dev", password: "••••••••••••••••",
    encryption: "SSL/TLS", authMethod: "Normal Password",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white">SMTP & IMAP Configuration</h2>
      <p className="text-gray-400 mb-8 text-sm">Use these details to configure your email client (Outlook, Apple Mail, Thunderbird) or integrate with external platforms.</p>
      <div className="bg-[#161b22] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Authentication</h3>
          <DetailRow label="Username (Full Email)" value={smtpData.username} fieldName="user" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="Password" value={smtpData.password} fieldName="pass" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="Authentication Method" value={smtpData.authMethod} fieldName="auth" copyToClipboard={copyToClipboard} copiedField={copiedField} />
        </div>
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-green-400 mb-4">Incoming Mail Server (IMAP / POP3)</h3>
          <DetailRow label="Server Hostname" value={smtpData.incomingServer} fieldName="in_host" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="IMAP Port (SSL/TLS)" value={smtpData.imapPort} fieldName="imap" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="POP3 Port (SSL/TLS)" value={smtpData.pop3Port} fieldName="pop3" copyToClipboard={copyToClipboard} copiedField={copiedField} />
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">Outgoing Mail Server (SMTP)</h3>
          <DetailRow label="Server Hostname" value={smtpData.outgoingServer} fieldName="out_host" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="SMTP Port (SSL/TLS)" value={smtpData.smtpPortSSL} fieldName="smtp_ssl" copyToClipboard={copyToClipboard} copiedField={copiedField} />
          <DetailRow label="SMTP Port (STARTTLS)" value={smtpData.smtpPortSTARTTLS} fieldName="smtp_start" copyToClipboard={copyToClipboard} copiedField={copiedField} />
        </div>
      </div>
      <div className="mt-6 p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-lg text-yellow-200/80 text-xs">
        <strong className="text-yellow-400">Developer Note:</strong> These credentials are for personal email clients. For application/transactional email sending, use the API to ensure high deliverability and avoid rate limits.
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

function PlaceholderView({ title, desc }: { title: string, desc: string }) {
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