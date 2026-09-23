import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { landingI18n } from '../../i18n/landing';

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

const commands: Record<PackageManager, string> = {
  pnpm: "pnpm add -g @aetherionfw/cli",
  npm: "npm install -g @aetherionfw/cli",
  yarn: "yarn global add @aetherionfw/cli",
  bun: "bun add -g @aetherionfw/cli"
};

export const CopyBlock: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [pm, setPm] = useState<PackageManager>('pnpm');
  const [lang, setLang] = useState<'en' | 'es'>('en');

  useEffect(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem('landing-lang') as 'en' | 'es';
      if (stored === 'es') setLang('es');
    } catch(e) {}

    // Listen to custom event from Navbar
    const handleLangChange = (e: any) => {
      if (e.detail === 'es' || e.detail === 'en') {
        setLang(e.detail);
      }
    };
    window.addEventListener('languagechange', handleLangChange);
    return () => window.removeEventListener('languagechange', handleLangChange);
  }, []);

  const dict = landingI18n[lang];
  const command = commands[pm];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 border-b border-[#30353b]/50">
      <h2 className="text-[20px] font-semibold text-white mb-8 tracking-tight">
        {dict['copy.title'] || 'Install the CLI and get started in seconds'}
      </h2>
      
      <div className="w-full max-w-lg rounded-xl border border-[#30353b] bg-[#0c1017] shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#1f242b] bg-[#090d13] px-2 pt-2">
          {(Object.keys(commands) as PackageManager[]).map((manager) => (
            <button
              key={manager}
              onClick={() => setPm(manager)}
              className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                pm === manager 
                  ? 'border-purple-500 text-white' 
                  : 'border-transparent text-[#7d8590] hover:text-[#e6edf3]'
              }`}
            >
              {manager}
            </button>
          ))}
        </div>
        
        {/* Command Line */}
        <div className="relative flex items-center justify-between p-4 bg-[#0d1117]">
          <code className="text-[#9ba0a6] text-[14px] font-mono select-all overflow-x-auto custom-scrollbar flex-1 mr-4">
            <span className="text-purple-400 select-none mr-2">$</span>
            {command}
          </code>
          
          <button
            onClick={handleCopy}
            className="p-2 shrink-0 rounded-md bg-[#181c24] border border-[#30353b] text-[#9ba0a6] hover:text-white hover:border-[#666666] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="Copy command"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
