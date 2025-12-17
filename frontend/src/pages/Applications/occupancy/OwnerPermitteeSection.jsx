import React from 'react';
import { OwnerAddressSelector } from './AddressSelectors';

const OwnerPermitteeSection = ({ formData, setFormData, handleOwnerDetailsChange }) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">2. Owner / Permittee Details</h2>
      <p className="text-sm text-gray-500">Tell us who is applying. We’ll use this for the certificate and contact information.</p>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Full Name</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="lastName" placeholder="Last Name" value={formData.ownerDetails.lastName} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
            <input type="text" name="givenName" placeholder="Given Name" value={formData.ownerDetails.givenName} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
            <input type="text" name="middleInitial" placeholder="M.I." value={formData.ownerDetails.middleInitial} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Address</h3>
          <div className="grid grid-cols-1 gap-3">
            <input type="text" name="address" placeholder="Street (you can still type manually)" value={formData.ownerDetails.address} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
            <OwnerAddressSelector value={formData.ownerDetails.address} onChange={(val)=> setFormData(prev=>({...prev, ownerDetails:{...prev.ownerDetails, address: val}}))} />
            <input type="number" name="zip" placeholder="ZIP Code" value={formData.ownerDetails.zip} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded w-full md:w-40" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="telNo" placeholder="Telephone Number" value={formData.ownerDetails.telNo} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded md:col-span-1" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerPermitteeSection;
