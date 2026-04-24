import React from 'react';

const Contact = () => {
  return (
    <div className="bg-[#fdfcfb] min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center">Contact Us</h1>
        <p className="text-gray-500 text-center mb-10">
          Have a question or feedback? We'd love to hear from you!
        </p>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea 
              rows="4"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              placeholder="How can we help?"
            ></textarea>
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-700 text-white font-bold py-4 rounded-xl hover:bg-orange-800 transition-colors shadow-lg shadow-orange-700/20"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;