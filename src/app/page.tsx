import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="247 Front Runner" width={180} height={45} priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-28 text-center mesh-gradient animate-fade-in">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          Recover revenue on autopilot
        </div>
        <h2 className="text-5xl md:text-6xl font-bold leading-tight">
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Stop Losing Money
          </span>
          <br />
          <span className="text-gray-900">From Missed Calls</span>
        </h2>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          When you miss a call, we automatically text the caller, capture their info, and help you close the deal. See exactly how much revenue you&apos;re recovering.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-lg hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            Start Recovering Revenue — $19/mo
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-200/60 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">20s</p>
            <p className="text-sm text-gray-500 mt-1">Average response time</p>
          </div>
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">62%</p>
            <p className="text-sm text-gray-500 mt-1">Lead capture rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">$2,400</p>
            <p className="text-sm text-gray-500 mt-1">Avg. monthly recovery</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-4">How It Works</h3>
          <p className="text-gray-500 text-center mb-14 max-w-lg mx-auto">Three simple steps to start recovering lost revenue from every missed call.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Miss a Call', desc: 'Customer calls your business number and you can\'t answer within 20 seconds.' },
              { step: '2', title: 'Auto-Text Sent', desc: 'We instantly text the caller with your custom message to keep them engaged.' },
              { step: '3', title: 'Revenue Recovered', desc: 'Track leads, mark conversions, and see exactly how much money you\'re saving.' },
            ].map((item) => (
              <div key={item.step} className="text-center bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-gray-50/50 py-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            247 Front Runner — Never lose a customer to a missed call again.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy.html" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms.html" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
