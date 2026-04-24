import React from 'react';

const TermsOfUse = () => {
  const lastUpdated = "April 24, 2026";

  return (
    <div className="bg-[#fdfcfb] min-h-screen pt-24 pb-16 px-6 text-gray-700">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-400 mb-10">Last Updated: {lastUpdated}</p>

        <section className="space-y-8">
          {/* 1. Acceptance */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Hamarat, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you must not use our application.
            </p>
          </div>

          {/* 2. AI Disclaimer - KRİTİK NOKTA */}
          <div className="bg-orange-50 p-6 rounded-2xl border-l-4 border-orange-700">
            <h2 className="text-xl font-semibold text-orange-900 mb-3">2. AI-Generated Content Disclaimer</h2>
            <p className="leading-relaxed text-orange-800">
              Hamarat utilizes Artificial Intelligence (Gemini API) to generate recipes, instructions, and dietary advice. 
              <strong> Please note:</strong> AI can make mistakes. Always use your personal judgment, check food safety guidelines, 
              and verify ingredients for allergies before cooking. Hamarat is not responsible for any outcome resulting from 
              following AI-generated suggestions.
            </p>
          </div>

          {/* 3. User Accounts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Responsibilities</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account information. You agree to use the service 
              only for lawful purposes and in a way that does not infringe the rights of others.
            </p>
          </div>

          {/* 4. Intellectual Property */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Intellectual Property</h2>
            <p className="leading-relaxed">
              The design, code, and original content of Hamarat are the property of its creators. Users retain ownership 
              of the content they personally upload, but grant Hamarat a license to display it within the platform.
            </p>
          </div>

          {/* 5. Limitation of Liability */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Limitation of Liability</h2>
            <p className="leading-relaxed">
              Hamarat shall not be liable for any indirect, incidental, or consequential damages resulting from your use 
              of the application or any errors in the content provided.
            </p>
          </div>

          {/* 6. Changes to Terms */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes by 
              updating the date at the top of this page.
            </p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 italic">
            Thank you for being part of the Hamarat community. Let's cook safely!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;