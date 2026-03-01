import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Missed Call Money</h1>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Log In</Link>
            <Link href="/signup" className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h2 className="text-5xl font-bold text-gray-900 leading-tight">
          Stop Losing Money<br />From Missed Calls
        </h2>
        <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto">
          When you miss a call, we automatically text the caller, capture their info, and help you close the deal. See exactly how much revenue you&apos;re recovering.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Start Recovering Revenue — $19/mo
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
              <h4 className="font-semibold text-gray-900 mb-1">Miss a Call</h4>
              <p className="text-sm text-gray-600">
                Customer calls your business number and you can&apos;t answer within 20 seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <h4 className="font-semibold text-gray-900 mb-1">Auto-Text Sent</h4>
              <p className="text-sm text-gray-600">
                We instantly text the caller with your custom message to keep them engaged.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <h4 className="font-semibold text-gray-900 mb-1">Revenue Recovered</h4>
              <p className="text-sm text-gray-600">
                Track leads, mark conversions, and see exactly how much money you&apos;re saving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <p className="text-center text-sm text-gray-500">
          Missed Call Money — Never lose a customer to a missed call again.
        </p>
      </footer>
    </div>
  );
}
