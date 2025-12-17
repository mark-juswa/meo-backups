import React from 'react';

const CertificationSignaturesSection = ({ formData, handleSignaturesChange, downloadFormAsPdf, onSubmit, loading, error }) => {
  return (
    <section className="mt-12 pt-8 border-t-2 border-gray-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">5. Certification & Signatures</h2>
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="mb-2 font-medium">Submitted by (Owner / Permittee)</p>
          <input name="ownerName" value={formData.signatures.ownerName} onChange={handleSignaturesChange} className="border border-gray-300 text-center w-full max-w-xs mx-auto p-1" placeholder="Owner full name" required />
          <div className="mt-3 space-y-1">
            <input name="ownerCtcNo" value={formData.signatures.ownerCtcNo} onChange={handleSignaturesChange} placeholder="CTC No." className="block w-full p-1 border border-gray-300 rounded" />
            <input type="date" name="ownerCtcDate" value={formData.signatures.ownerCtcDate} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
            <input name="ownerCtcPlace" value={formData.signatures.ownerCtcPlace} onChange={handleSignaturesChange} placeholder="Place Issued" className="block w-full p-1 border border-gray-300 rounded" />
          </div>
        </div>

        <div className="text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="mb-2 font-medium">Attested by (Inspector)</p>
          <input name="inspectorName" value={formData.signatures.inspectorName} onChange={handleSignaturesChange} className="border-b-2 text-center w-full max-w-xs mx-auto p-1" placeholder="Inspector full name" required />
        </div>

        <div className="text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="mb-2 font-medium">Prepared by (Architect / Civil Engineer)</p>
          <input name="engineerName" value={formData.signatures.engineerName} onChange={handleSignaturesChange} className="border-b-2 text-center w-full max-w-xs mx-auto p-1" placeholder="Engineer full name" required />
          <div className="mt-3 space-y-1 text-left max-w-sm mx-auto">
            <input name="engineerPrcNo" value={formData.signatures.engineerPrcNo} onChange={handleSignaturesChange} placeholder="PRC No." className="block w-full p-1 border border-gray-300 rounded" />
            <input type="date" name="engineerPrcValidity" value={formData.signatures.engineerPrcValidity} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
            <input name="engineerPtrNo" value={formData.signatures.engineerPtrNo} onChange={handleSignaturesChange} placeholder="PTR No." className="block w-full p-1 border border-gray-300 rounded" />
            <input type="date" name="engineerPtrDate" value={formData.signatures.engineerPtrDate} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
            <input name="engineerIssuedAt" value={formData.signatures.engineerIssuedAt} onChange={handleSignaturesChange} placeholder="Issued at" className="block w-full p-1 border border-gray-300 rounded" />
            <input name="engineerTin" value={formData.signatures.engineerTin} onChange={handleSignaturesChange} placeholder="TIN" className="block w-full p-1 border border-gray-300 rounded" />
            <input name="engineerCtcNo" value={formData.signatures.engineerCtcNo} onChange={handleSignaturesChange} placeholder="CTC No." className="block w-full p-1 border border-gray-300 rounded" />
            <input type="date" name="engineerCtcDate" value={formData.signatures.engineerCtcDate} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
            <input name="engineerCtcPlace" value={formData.signatures.engineerCtcPlace} onChange={handleSignaturesChange} placeholder="CTC Place" className="block w-full p-1 border border-gray-300 rounded" />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 border-t border-indigo-100">
        <button type="button" onClick={downloadFormAsPdf} className="bg-red-600 text-white px-4 py-2 rounded mr-3">Download Filled PDF</button>
        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </section>
  );
};

export default CertificationSignaturesSection;
