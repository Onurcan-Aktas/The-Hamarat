import React from 'react';
import { useNavigate } from 'react-router-dom';


const About = () => {
const navigate = useNavigate();

  return (
    <div className="bg-[#fdfcfb] min-vh-100 pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Başlık Bölümü */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
            About <span className="text-orange-700">Hamarat</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed italic">
            "Redefining the modern kitchen with intelligence and passion."
          </p>
        </div>

        {/* Hikayemiz / Vizyon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hamarat started as a vision to simplify the culinary experience for everyone. 
              We believe that cooking shouldn't be a chore, but a creative journey.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By combining software engineering with culinary arts, we created an 
              AI-driven platform that understands your ingredients and guides you 
              through every step of the process.
            </p>
          </div>
          <div className="bg-orange-100 h-64 rounded-2xl flex items-center justify-center">
            {/* Buraya mutfakla ilgili bir görsel veya ikon gelebilir */}
            <span className="text-orange-700 text-6xl">🍳</span>
          </div>
        </div>

        {/* Özellikler Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-bold text-gray-800 mb-2">AI Powered</h3>
            <p className="text-sm text-gray-500">Smart recipe suggestions using advanced Gemini AI technology.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="font-bold text-gray-800 mb-2">Modern UI</h3>
            <p className="text-sm text-gray-500">Minimalist and clean design for a distraction-free cooking experience.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-4">🌱</div>
            <h3 className="font-bold text-gray-800 mb-2">Community</h3>
            <p className="text-sm text-gray-500">A platform built by food lovers, for food lovers.</p>
          </div>
        </div>

        {/* İletişim / Vizyon Kapanış */}
        <div className="bg-orange-700 text-white rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Journey</h2>
          <p className="opacity-90 mb-6">We are constantly evolving and adding new features to make your kitchen smarter.</p>
          <button onClick={() => navigate('/contact')} className="bg-white text-orange-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all " >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;