import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAxiosPrivate from '../../hooks/useAxiosPrivate'; 
import { ArrowUpTrayIcon, DocumentIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ReuploadPage = () => {
    const { id } = useParams(); // Reference No
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]); // Changed to Array
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const loadApp = async () => {
            try {
                const res = await axiosPrivate.get(`/api/applications/track/${id}`);
                setApplication(res.data.application);
            } catch (err) {
                alert("Failed to load application.");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        loadApp();
    }, [id, navigate, axiosPrivate]);

    const handleFileChange = (e) => {
        // Convert FileList to Array and append to existing selection
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return alert("Please select at least one file.");

        const formData = new FormData();
        
        // Append all files with the same key 'files' (matches backend .array('files'))
        selectedFiles.forEach(file => {
            formData.append("files", file);
        });
        
        formData.append("appId", application._id);
        formData.append("applicationType", application.applicationType);

        setUploading(true);
        try {
            await axiosPrivate.post('/api/documents/revision', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Revisions uploaded successfully!");
            navigate(`/track/${application.referenceNo}`);
        } catch (err) {
            console.error(err);
            alert("Upload failed. " + (err.response?.data?.message || ""));
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!application) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                
                <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start">
                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 mr-4" />
                    <div>
                        <h2 className="text-xl font-bold text-amber-900">Application Returned for Revision</h2>
                        <p className="text-sm text-amber-700 mt-1">Please review the comments and upload the required documents (Checklists, Forms, etc).</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mr-2" />
                            Reason for Rejection
                        </h3>
                        
                        {/* Admin Comments */}
                        {application.rejectionDetails?.comments && (
                            <div className="mb-4 p-3 bg-white rounded border border-amber-200">
                                <p className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wide">Admin Comments:</p>
                                <p className="text-sm text-gray-800 italic">"{application.rejectionDetails.comments}"</p>
                            </div>
                        )}
                        
                        {/* Flagged Documents List */}
                        {application.rejectionDetails?.missingDocuments?.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-red-800 mb-2 uppercase tracking-wide">
                                    Flagged Items ({application.rejectionDetails.missingDocuments.length}):
                                </p>
                                <ul className="list-disc list-inside space-y-1 bg-red-50 p-3 rounded border border-red-200">
                                    {application.rejectionDetails.missingDocuments.map((doc, i) => (
                                        <li key={i} className="text-red-700 text-sm font-medium">{doc}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {!application.rejectionDetails?.comments && !application.rejectionDetails?.missingDocuments?.length && (
                            <p className="text-gray-600 italic">Please update your documents as requested.</p>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-blue-50">
                        <DocumentIcon className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                        <h3 className="text-lg font-bold text-blue-900">Upload Files</h3>
                        <p className="text-sm text-gray-500 mb-4">PDF, DOCX, or Images allowed. You can select multiple files.</p>

                        <input 
                            type="file" 
                            id="revision-upload" 
                            multiple 
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        
                        <label htmlFor="revision-upload" className="cursor-pointer inline-block px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg border border-blue-200 hover:bg-blue-50 shadow-sm transition">
                            + Select Files
                        </label>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-6 space-y-2 text-left">
                                <p className="text-xs font-bold text-gray-500 uppercase">Files to Upload:</p>
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                        <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedFiles.length > 0 && (
                            <button 
                                onClick={handleUpload} 
                                disabled={uploading}
                                className="block w-full mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : `Submit ${selectedFiles.length} Files`}
                            </button>
                        )}
                    </div>

                    <button onClick={() => navigate(-1)} className="mt-6 w-full text-center text-gray-400 hover:text-gray-600">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReuploadPage;