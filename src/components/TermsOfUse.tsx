import React from "react";
import { X, FileText, ShieldCheck, ChevronLeft } from "lucide-react";

interface TermsOfUseProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating a Loop account or using the app, you agree to these Terms of Use. If you do not agree, please do not use the service. We may update these terms from time to time, and continued use after changes means you accept the updated terms.",
  },
  {
    title: "2. Health & Safety Disclaimer",
    body: "Loop provides fitness tracking, route suggestions, and community meetups for informational purposes only. It is not medical advice. Consult a qualified healthcare professional before starting any new exercise program. You participate in walks, jogs, sprints, and meetups at your own risk.",
  },
  {
    title: "3. Community & Meetups",
    body: "Pings and buddy meetups connect you with other members. Always meet in public places, share your live location with a trusted contact, and use good judgement. Loop does not verify the identity of every member and is not responsible for interactions between users.",
  },
  {
    title: "4. Your Account",
    body: "You are responsible for keeping your login credentials secure and for all activity under your account. Provide accurate profile information and keep it up to date. You must be at least 13 years old (or the minimum age in your country) to use Loop.",
  },
  {
    title: "5. Acceptable Use",
    body: "Do not harass other members, post misleading routes, spam the feed, or use the service for any unlawful purpose. We may suspend or remove accounts that violate these rules or harm the community.",
  },
  {
    title: "6. Location & Data",
    body: "With your permission, Loop collects location and activity data to power maps, routes, and stats. You control what you share in your privacy settings. We do not sell your personal data. See our Privacy Policy for full details on how data is handled.",
  },
  {
    title: "7. User Content",
    body: "You retain ownership of the routes, reviews, and photos you post, but grant Loop a licence to display them within the app so other members can discover them. Do not upload content you do not have the rights to share.",
  },
  {
    title: "8. Limitation of Liability",
    body: "Loop is provided \"as is\" without warranties of any kind. To the fullest extent permitted by law, Loop and its team are not liable for injuries, losses, or damages arising from your use of the app, routes, or meetups.",
  },
  {
    title: "9. Contact",
    body: "Questions about these terms? Reach us at support@walkbuddy.io. We are happy to help.",
  },
];

/**
 * Full-screen Terms of Use page. Rendered as an overlay so it works without a
 * router — opened from the profile drawer and dismissed with the back button.
 */
export default function TermsOfUse({ isOpen, onClose }: TermsOfUseProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[4000] bg-[#f8f1e3] overflow-y-auto animate-fadeIn">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[#f8f1e3]/90 backdrop-blur-2xl border-b border-black/30 px-4 md:px-10 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors font-black text-xs uppercase tracking-wider"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2 font-headline font-black uppercase tracking-wider text-sm text-black">
          <FileText className="w-5 h-5 text-black" />
          <span>Terms of Use</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-black" />
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8 pb-20 space-y-6">
        {/* Intro */}
        <div className="pb-6 border-b border-black/30">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-6 h-6 text-black shrink-0" />
            <div>
              <h1 className="font-headline text-2xl font-black text-black italic uppercase tracking-tight leading-none">
                Loop Terms of Use
              </h1>
              <p className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 text-accent-serif">
                Last updated: July 2026
              </p>
            </div>
          </div>
          <p className="text-base md:text-[17px] text-gray-600 leading-[1.7]">
            Welcome to Loop. These terms explain the ground rules for using
            the app, joining meetups, and keeping our outdoor community safe and
            friendly. Please read them carefully.
          </p>
        </div>

        {/* Sections — a divided list, not a stack of cards */}
        <div className="divide-y divide-black/15">
          {SECTIONS.map((section) => (
            <section key={section.title} className="py-5 first:pt-0">
              <h2 className="font-headline text-base md:text-lg font-black text-black uppercase tracking-wider mb-2.5">
                {section.title}
              </h2>
              <p className="text-[15px] md:text-base text-gray-600 leading-[1.75]">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full border border-black bg-black text-white font-headline font-black text-sm py-4 uppercase tracking-wider active:scale-95 transition-all hover:opacity-90"
        >
          Got it — back to Loop
        </button>
      </main>
    </div>
  );
}
