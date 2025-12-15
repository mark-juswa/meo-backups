import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
    CloudArrowUpIcon, 
    DocumentTextIcon, 
    XMarkIcon,
    CheckCircleIcon,
    ArrowLeftIcon 
} from '@heroicons/react/24/outline';

const DocumentUpload = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();
    const { auth } = useAuth();
    
    const applicationData = location.state?.applicationData;
    
    const [files, setFiles] = useState({});
    const [uploading, setUploading] = useState(false);
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    // Building permit requirements based on Checklist.jsx
    const requiredDocuments = [
        { 
            id: 'building_permit_form', 
            title: 'Application for Building Permit Form',
            description: 'Filled and signed building permit application form'
        },
        { 
            id: 'architectural_plans', 
            title: 'Architectural Plans',
            description: 'Complete set of architectural drawings and plans'
        },
        { 
            id: 'structural_plans', 
            title: 'Structural Plans',
            description: 'Structural engineering plans and calculations'
        },
        { 
            id: 'electrical_plans', 
            title: 'Electrical Plans',
            description: 'Electrical wiring and installation plans'
        },
        { 
            id: 'plumbing_plans', 
            title: 'Plumbing/Sanitary Plans',
            description: 'Plumbing and sanitary installation plans'
        },
        { 
            id: 'lot_title', 
            title: 'Lot Title/TCT',
            description: 'Transfer Certificate of Title or similar land document'
        },
        { 
            id: 'tax_declaration', 
            title: 'Tax Declaration',
            description: 'Latest tax declaration of the property'
        },
        { 
            id: 'location_clearance', 
            title: 'Location Clearance',
            description: 'Barangay location clearance certificate'
        },
        { 
            id: 'environmental_clearance', 
            title: 'Environmental Compliance Certificate',
            description: 'ECC or Certificate of Non-Coverage from DENR'
        }
    ];

    useEffect(() => {
        // If no application data in state, redirect back
        if (!applicationData) {
            navigate('/building-application', { 
                replace: true,
                state: { error: 'Session expired. Please resubmit your application.' }
            });
        }
    }, [applicationData, navigate]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e, docId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            handleFileSelect(droppedFiles[0], docId);
        }
    };

    const handleFileSelect = (file, docId) => {
        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload only PDF, Word documents, or image files (JPG, PNG).');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        setFiles(prev => ({ ...prev, [docId]: file }));
    };

    const removeFile = (docId) => {
        setFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[docId];
            return newFiles;
        });
    };

    const uploadDocuments = async () => {
        const filesToUpload = Object.keys(files);
        if (filesToUpload.length === 0) {
            alert('Please select at least one document to upload.');
            return;
        }

        setUploading(true);
        const uploadedDocs = [];

        try {
            for (const docId of filesToUpload) {
                const file = files[docId];
                const docInfo = requiredDocuments.find(doc => doc.id === docId);
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('requirementName', docInfo.title);
                formData.append('applicationId', id);

                const response = await axios.post(
                    `/api/applications/${id}/upload-documents`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${auth.accessToken}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                uploadedDocs.push({
                    docId,
                    title: docInfo.title,
                    fileName: file.name,
                    uploadedAt: new Date()
                });
            }

            setUploadedDocuments(uploadedDocs);
            setFiles({});
            alert('Documents uploaded successfully!');
            
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.response?.data?.message || 'Failed to upload documents. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const finishAndGoHome = () => {
        navigate('/?status=building_submitted', { replace: true });
    };

    const skipDocuments = () => {
        if (window.confirm('Are you sure you want to skip document upload? You can upload documents later from your application tracking page.')) {
            navigate('/?status=building_submitted', { replace: true });
        }
    };

    if (!applicationData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Loading application data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Upload Supporting Documents</h1>
                            <p className="text-gray-600 mt-1">
                                Application Reference: <span className="font-semibold text-blue-600">{applicationData.referenceNo}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Upload your supporting documents to expedite the review process. This step is optional but highly recommended.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 mr-1" />
                            Back
                        </button>
                    </div>
                </div>

                {/* Document Upload Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {requiredDocuments.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                            </div>
                            
                            <div className="p-4">
                                {!files[doc.id] ? (
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={(e) => handleDrop(e, doc.id)}
                                    >
                                        <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600 mb-3">
                                            Drag and drop your file here, or
                                        </p>
                                        <label className="cursor-pointer">
                                            <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                                Choose File
                                            </span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0], doc.id)}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">
                                            PDF, DOC, JPG, PNG (Max 10MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center">
                                            <DocumentTextIcon className="w-5 h-5 text-green-600 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-green-800">{files[doc.id].name}</p>
                                                <p className="text-xs text-green-600">
                                                    {(files[doc.id].size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(doc.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Uploaded Documents Summary */}
                {uploadedDocuments.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Successfully Uploaded Documents
                        </h3>
                        <ul className="space-y-2">
                            {uploadedDocuments.map((doc, index) => (
                                <li key={index} className="flex items-center text-sm text-green-700">
                                    <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                                    {doc.title} - {doc.fileName}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                        <button
                            onClick={skipDocuments}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Skip for Now
                        </button>
                        
                        {Object.keys(files).length > 0 && (
                            <button
                                onClick={uploadDocuments}
                                disabled={uploading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400"
                            >
                                {uploading ? 'Uploading...' : `Upload ${Object.keys(files).length} Document(s)`}
                            </button>
                        )}
                        
                        {uploadedDocuments.length > 0 && (
                            <button
                                onClick={finishAndGoHome}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                Finish & Go Home
                            </button>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        You can also upload or update documents later from your application tracking page.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;