import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="relative isolate overflow-hidden bg-[#000] py-24 sm:py-32 flex flex-col items-center justify-center text-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 transform-gpu blur-3xl" aria-hidden="true">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#f59e0b] to-[#ea580c] opacity-20" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 backdrop-blur-md bg-white/5 cursor-pointer">
              Announcing v1.0.0.{' '}
              <a href="/getting-started/quickstart" className="font-semibold text-yellow-500">
                <span className="absolute inset-0" aria-hidden="true" />
                Read the docs <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Serverless Framework for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Next Era</span>.
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-300">
            A highly opinionated, decorator-driven TypeScript framework that unifies your logic, provisions 1:1 Lambda architectures via CDKTF, and generates OpenAPI docs automatically.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="/getting-started/quickstart" className="rounded-md bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-yellow-400 hover:to-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 transition-all duration-300 transform hover:scale-105">
              Get Started
            </a>
            <a href="https://github.com/CrisD3v/Aetherion-framework" className="text-sm font-semibold leading-6 text-white hover:text-yellow-400 transition-colors duration-200">
              View on GitHub <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
