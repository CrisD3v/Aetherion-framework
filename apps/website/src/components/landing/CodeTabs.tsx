import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlight, themes } from 'prism-react-renderer';
import { showcaseCode } from '../../data/landing';

type Tab = 'controller' | 'infrastructure' | 'openapi';

export const CodeTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('controller');

  const tabs: { id: Tab; label: string; language: string }[] = [
    { id: 'controller', label: 'UsersController.ts', language: 'typescript' },
    { id: 'infrastructure', label: 'AetherionStack.ts', language: 'typescript' },
    { id: 'openapi', label: 'openapi.yaml', language: 'yaml' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-16 md:mt-24">
      <div className="rounded-xl border border-[#30353b] bg-[#0c1017] overflow-hidden shadow-2xl flex flex-col">
        {/* macOS Window Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1f242b] bg-[#090d13]">
          <div className="flex items-center px-4 py-3 gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar w-full md:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none text-[13px] font-mono px-6 py-3 transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id ? 'text-[#e6edf3] bg-[#161b22]' : 'text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#161b22]/50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="code-active-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-purple-400"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Code Content with Syntax Highlighting */}
        <div className="w-full bg-[#0d1117] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              className="p-6 overflow-x-auto custom-scrollbar"
            >
              <Highlight
                theme={themes.vsDark}
                code={showcaseCode[activeTab].trim()}
                language={tabs.find(t => t.id === activeTab)?.language || 'typescript'}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} text-[13px] md:text-[14px] leading-relaxed font-mono`} style={{ ...style, backgroundColor: 'transparent' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line, key: i })} className="table-row">
                        <span className="table-cell text-right pr-6 select-none text-[#484f58] opacity-50 text-[12px] w-[30px]">
                          {i + 1}
                        </span>
                        <span className="table-cell">
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token, key })} />
                          ))}
                        </span>
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
