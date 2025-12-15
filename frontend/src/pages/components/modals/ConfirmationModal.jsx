import React, { useState } from 'react';

export default function ConfirmationModal({ isOpen, onClose, title = '', message = '', onConfirm = () => {}, showInput = false, confirmText = 'Confirm' }) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput && !inputValue.trim()) {
      alert('A reason or comment is required for this action.');
      return;
    }
    onConfirm(inputValue);
    setInputValue('');
    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm p-6 rounded-xl shadow-2xl">
        <h3 className="text-xl font-bold mb-3 text-red-600">{title}</h3>
        <div className="text-gray-700 mb-6">{message}</div>
        {showInput && (
          <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full p-2 border rounded-lg mb-4 resize-none" rows="3" placeholder="Enter reason or comments..."></textarea>
        )}
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg">Cancel</button>
          <button id="confirm-action-btn" type="button" onClick={handleConfirm} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg shadow-md">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
