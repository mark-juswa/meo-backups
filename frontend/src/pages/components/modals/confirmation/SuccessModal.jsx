import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

export default function SuccessModal({ isOpen, onClose, title, message, buttonText = "Okay" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 border border-gray-100">
        
        {/* Green Circle Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <CheckIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <div className="mt-2 mb-8">
          <p className="text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}