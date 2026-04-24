import React from 'react';
import { Link } from 'react-router-dom';
import About from '../pages/About'

const Footer = () => {
  return (
    <footer className="bg-[#fdfcfb] border-t border-gray-100 pt-16 pb-8 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
        
        {/* Brand & About */}
        <div className="col-span-1">
          <h2 className="text-2xl font-serif font-bold text-orange-700 mb-4">Hamarat</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your smart kitchen assistant that transforms cooking into an art, 
            accompanying you through every recipe.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-gray-800 font-semibold mb-6">Quick Links</h4>
          <ul className="space-y-4">
            <li><Link to="/" className="text-gray-500 hover:text-orange-600 transition-colors text-sm">Discover</Link></li>
            <li><Link to="/create" className="text-gray-500 hover:text-orange-600 transition-colors text-sm">Add Your Recipe</Link></li>
            <li><Link to="/about" className="text-gray-500 hover:text-orange-600 transition-colors text-sm">About Us</Link></li>
          </ul>
        </div>

        {/* Legal & Social */}
        <div>
          <h4 className="text-gray-800 font-semibold mb-6">Support & Social</h4>
          <ul className="space-y-4 mb-6">
            <li><Link to="/termsofuse" className="text-gray-500 hover:text-orange-600 transition-colors text-sm">Terms of Use</Link></li>
            <li><Link to="/contact" className="text-gray-500 hover:text-orange-600 transition-colors text-sm">Contact Us</Link></li>
          </ul>
          <div className="flex justify-center md:justify-start space-x-4">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 
              cursor-pointer transition-colors text-sm font-medium">Instagram</a>

            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 
              cursor-pointer transition-colors text-sm font-medium">Youtube</a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-xs">
        <p>&copy; {new Date().getFullYear()} Hamarat. All Rights Reserved.</p>
        <p className="mt-4 md:mt-0 italic text-orange-600/60">Smart tools for smart cooks.</p>
      </div>
    </footer>
  );
};

export default Footer;