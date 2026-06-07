// src/app/pricing/page.tsx
import Link from 'next/link';

const plans = [
  {
    name: "Starter",
    price: "$5",
    period: "/month",
    description: "Perfect for personal projects, portfolios, and single domains.",
    features: [
      "1 Custom Domain",
      "5 Email Mailboxes",
      "10 GB Storage per mailbox",
      "Standard Spam Protection",
      "Community Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$15",
    period: "/month",
    description: "Ideal for growing businesses, startups, and small teams.",
    features: [
      "3 Custom Domains",
      "25 Email Mailboxes",
      "50 GB Storage per mailbox",
      "Advanced Spam & Virus Filtering",
      "Mailing Lists & Aliases",
      "Priority Email Support",
    ],
    cta: "Get Professional",
    popular: true,
  },
  {
    name: "Agency",
    price: "$49",
    period: "/month",
    description: "For agencies and developers managing multiple client domains.",
    features: [
      "Unlimited Custom Domains",
      "Unlimited Email Mailboxes",
      "Unlimited Storage",
      "White-label Dashboard Options",
      "Full API Access",
      "Dedicated Account Manager",
    ],
    cta: "Contact Sales",
    popular: false,
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-mono p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <Link href="/" className="text-lg font-bold text-white tracking-tight hover:text-blue-400 transition-colors">
            ← Back to Maild
          </Link>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Simple, Transparent Pricing
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        {/* Subtitle */}
        <div className="text-center mb-12">
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Enterprise-grade email hosting powered by MXroute. No hidden fees, no per-user surprises.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'bg-[#161b22] border-blue-500 shadow-2xl shadow-blue-900/20' 
                  : 'bg-[#161b22] border-gray-800 hover:border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/30' 
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer / Trust Badge */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-xs">
            All plans include a 14-day money-back guarantee. Powered by highly-reputed MXroute infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}