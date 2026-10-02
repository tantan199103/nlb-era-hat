import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const POLICY_CONTENT = {
  about: {
    label: 'About Lids HD',
    title: 'Built for the next drop',
    intro: 'Lids HD is a focused hat-drop storefront for verified, sourceable headwear and collectible releases.',
    sections: [
      ['What we do', 'We curate hat listings, verify the corresponding 1688 source before publishing, and keep unverified listings out of the live catalog.'],
      ['A clear catalog standard', 'Every sellable listing must pass the MATCHED source gate. This keeps product discovery and fulfillment aligned with the inventory we can actually source.'],
      ['Need help?', 'Email support@lidshatdrop.com with your order number or account email and our team will help with the next step.'],
    ],
  },
  privacy: {
    label: 'Privacy policy',
    title: 'Your data, kept focused',
    intro: 'This storefront only uses the information needed to operate accounts, orders, support and release notifications.',
    sections: [
      ['Information we use', 'Account email, profile preferences, order details and notification subscriptions are stored in Supabase so the requested store feature can work.'],
      ['How it is used', 'We use this information to authenticate you, process and track orders, save preferences, answer support requests and send opted-in drop notifications.'],
      ['Your controls', 'You can sign out at any time. For data access or deletion requests, contact support@lidshatdrop.com from the email associated with your account.'],
    ],
  },
  terms: {
    label: 'Terms of service',
    title: 'Shop with the drop rules',
    intro: 'By using this storefront, you agree to provide accurate checkout information and use the service for legitimate purchases and account activity.',
    sections: [
      ['Listings and availability', 'A product is not offered for sale until its 1688 source is verified. Inventory and release timing can change before an order is accepted.'],
      ['Orders', 'A checkout request creates a pending order. Payment and fulfillment status are confirmed separately; an order reference is valid only when returned by the store.'],
      ['Support', 'If an order or listing appears incorrect, contact support@lidshatdrop.com promptly with the relevant reference.'],
    ],
  },
  sustainability: {
    label: 'Sustainability',
    title: 'Less waste, clearer sourcing',
    intro: 'Our catalog gate is also an inventory discipline: products stay hidden until the source and availability can be reviewed.',
    sections: [
      ['Source before sale', 'We do not publish a product solely because it appears in an imported catalog. A matching 1688 listing must be reviewed first.'],
      ['Smarter catalog operations', 'The queue, source evidence and admin audit trail help the team avoid unnecessary listings and reduce avoidable fulfillment exceptions.'],
    ],
  },
  accessibility: {
    label: 'Accessibility statement',
    title: 'A storefront that works for more people',
    intro: 'We are improving keyboard navigation, focus states, readable contrast and responsive layouts across the storefront and admin portal.',
    sections: [
      ['Current support', 'Interactive controls include visible focus treatment, form labels and status messages. The layout is designed to remain usable on small screens.'],
      ['Tell us what is blocked', 'If a page or checkout step is difficult to use, email support@lidshatdrop.com with the page and device details so we can investigate.'],
    ],
  },
};

export default function PolicyPage({ slug = 'about', onBack }) {
  const content = POLICY_CONTENT[slug] || POLICY_CONTENT.about;
  return (
    <div className="mx-auto max-w-[900px] animate-fade-in px-4 py-12 sm:py-16 lg:px-8">
      <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white">
        <ArrowLeft size={14} aria-hidden="true" /> Back to storefront
      </button>
      <div className="rounded-xl border border-[#282828] bg-[#141414] p-6 shadow-xl sm:p-10">
        <div className="mb-8 border-b border-[#282828] pb-6">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#ff3b30]"><ShieldCheck size={14} aria-hidden="true" /> {content.label}</div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">{content.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">{content.intro}</p>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Effective October 2, 2026</p>
        </div>
        <div className="space-y-7">
          {content.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="font-display text-lg font-black uppercase tracking-wider text-white">{heading}</h2>
              <p className="mt-2 text-sm leading-7 text-gray-400">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
