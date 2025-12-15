import { ExclamationTriangleIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isProcessing = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 border border-gray-100">
        
        {/* Yellow/Warning Circle Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-50 mb-6">
          <ArrowLeftStartOnRectangleIcon className="h-10 w-10 text-yellow-500" aria-hidden="true" />
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
            <button
                type="button"
                disabled={isProcessing}
                className="w-full inline-flex justify-center rounded-xl border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onConfirm}
            >
                {isProcessing ? "Processing..." : confirmText}
            </button>

            <button
                type="button"
                disabled={isProcessing}
                className="w-full inline-flex justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                onClick={onClose}
            >
                {cancelText}
            </button>
        </div>
      </div>
    </div>
  );
}