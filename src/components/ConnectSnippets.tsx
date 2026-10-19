import React, { useState } from 'react';
import { Terminal, Code2, Globe, Check, Copy } from 'lucide-react';
import { MCP_URL } from '../lib/relay';

interface ConnectSnippetsProps {
  apiKey?: string | null;
  placeholder?: string;
}

export const ConnectSnippets: React.FC<ConnectSnippetsProps> = ({
  apiKey,
  placeholder = 'am_live_YOUR_KEY',
}) => {
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'generic'>('claude');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const displayKey = apiKey || placeholder;

  const claudeSnippet = `claude mcp add --transport http agentmail ${MCP_URL} --header "Authorization: Bearer ${displayKey}"`;

  const cursorSnippet = JSON.stringify(
    {
      mcpServers: {
        agentmail: {
          url: MCP_URL,
          headers: {
            Authorization: `Bearer ${displayKey}`,
          },
        },
      },
    },
    null,
    2
  );

  const genericSnippet = `# Remote MCP Endpoint
URL: ${MCP_URL}
Method: POST
Headers:
  Authorization: Bearer ${displayKey}
  Content-Type: application/json`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 bg-zinc-950/60">
        <div className="flex gap-1 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('claude')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'claude'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Claude Code</span>
          </button>
          <button
            onClick={() => setActiveTab('cursor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cursor'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Cursor / Windsurf</span>
          </button>
          <button
            onClick={() => setActiveTab('generic')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'generic'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Any MCP Client</span>
          </button>
        </div>

        <button
          onClick={() => {
            const current =
              activeTab === 'claude'
                ? claudeSnippet
                : activeTab === 'cursor'
                ? cursorSnippet
                : genericSnippet;
            handleCopy(current, activeTab);
          }}
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
          title="Copy snippet"
        >
          {copiedKey === activeTab ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Snippet Content */}
      <div className="p-4 bg-[#0a0c12]">
        {activeTab === 'claude' && (
          <div>
            <div className="text-[11px] text-zinc-400 mb-2">
              Run this command in your terminal to connect Claude Code to AgentMail:
            </div>
            <pre className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-xs text-zinc-200 overflow-x-auto selection:bg-cyan-500/30 whitespace-pre-wrap break-all">
              {claudeSnippet}
            </pre>
          </div>
        )}

        {activeTab === 'cursor' && (
          <div>
            <div className="text-[11px] text-zinc-400 mb-2">
              Add to your Cursor MCP settings file (<code className="text-cyan-400">~/.cursor/mcp.json</code> or project <code className="text-cyan-400">.cursor/mcp.json</code>):
            </div>
            <pre className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-xs text-zinc-200 overflow-x-auto selection:bg-cyan-500/30">
              {cursorSnippet}
            </pre>
          </div>
        )}

        {activeTab === 'generic' && (
          <div>
            <div className="text-[11px] text-zinc-400 mb-2">
              Configure your MCP client with HTTP transport and your AgentMail authorization key:
            </div>
            <pre className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-xs text-zinc-200 overflow-x-auto selection:bg-cyan-500/30 whitespace-pre-wrap">
              {genericSnippet}
            </pre>
          </div>
        )}

        <p className="mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 leading-relaxed">
          If your MCP client has a dedicated{' '}
          <span className="text-zinc-400">API-key / Bearer-token</span> field, paste only the raw
          key — the client adds the <span className="text-zinc-400">Bearer</span> prefix itself.
          Raw header fields (as shown above) need the full{' '}
          <code className="text-cyan-400/80">Authorization: Bearer …</code> line.
        </p>
      </div>
    </div>
  );
};
