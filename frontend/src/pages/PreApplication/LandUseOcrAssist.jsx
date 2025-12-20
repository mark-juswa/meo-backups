import React, { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const initialData = {
  applicantName: '',
  projectLocation: '',
  barangay: '',
  cityMunicipality: '',
  lotNumber: '',
  blockNumber: '',
  existingLandUse: '',
  zoningClassification: '',
  projectTypeNature: '',
  lotArea: '',
  projectCost: ''
};

const Field = ({ label, name, value, onChange, ocrAssisted }) => (
  <div className={`p-3 rounded-lg border ${ocrAssisted ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={ocrAssisted ? 'OCR suggested — please verify' : ''}
    />
    {ocrAssisted && <p className="text-xs text-amber-700 mt-1">OCR-assisted (editable)</p>}
  </div>
);

export default function LandUseOcrAssist() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromBuilding = location?.state?.from === 'building';

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [ocrResult, setOcrResult] = useState(null);
  const [data, setData] = useState(initialData);
  const [ocrAssistedFields, setOcrAssistedFields] = useState({});
  const [warnings, setWarnings] = useState([]);

  const [landUseId, setLandUseId] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  const headers = useMemo(
    () => ({ headers: { Authorization: `Bearer ${auth?.accessToken}` } }),
    [auth]
  );

  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setOcrResult(null);
    setConfirmed(false);
    setPdfReady(false);
    setLandUseId(null);
    setData(initialData);
    setOcrAssistedFields({});
    setWarnings([]);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setPdfReady(false);
  };

  const runOcr = async () => {
    if (!file) return alert('Please select a scanned document (image or PDF).');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await axios.post('/api/pre-application/ocr/upload', form, {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setOcrResult(res.data);
      const fields = res.data?.parsed?.fields || {};
      const fieldScores = res.data?.parsed?.fieldScores || {};

      setData((prev) => ({ ...prev, ...fields }));
      setOcrAssistedFields(
        Object.fromEntries(Object.entries(fieldScores).map(([k, v]) => [k, v === 1]))
      );
      setWarnings(res.data?.warnings || []);

      // Create a Draft record immediately (safe, isolated) so user can come back later.
      const draft = await axios.post(
        '/api/pre-application/land-use',
        {
          data: { ...initialData, ...fields },
          ocr: {
            rawText: res.data?.rawText || '',
            confidence: res.data?.confidence ?? null,
            warnings: res.data?.warnings || [],
            uploadedFileName: file.name,
            uploadedMimeType: file.type,
            extractedAt: new Date().toISOString()
          }
        },
        headers
      );

      setLandUseId(draft.data?.landUseApplication?._id || null);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'OCR failed. Please try again with a clearer scan.');
    } finally {
      setUploading(false);
    }
  };

  const saveEdits = async () => {
    if (!landUseId) return alert('No draft record found yet. Please run OCR first.');
    await axios.put(`/api/pre-application/land-use/${landUseId}`, { data }, headers);
  };

  const confirm = async () => {
    if (!landUseId) return alert('No draft record found yet. Please run OCR first.');
    try {
      await saveEdits();
      await axios.post(`/api/pre-application/land-use/${landUseId}/confirm`, { data }, headers);
      setConfirmed(true);
      alert('Data confirmed (Verified). You can now generate the filled PDF.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to confirm data.');
    }
  };

  const generatePdf = async () => {
    if (!landUseId) return alert('No record found.');
    try {
      await axios.post(`/api/pre-application/land-use/${landUseId}/generate-pdf`, {}, headers);
      setPdfReady(true);
      alert('PDF generated. Click Preview/Download.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to generate PDF.');
    }
  };

  const openPdf = () => {
    if (!landUseId) return;
    window.open(`/api/pre-application/land-use/${landUseId}/pdf`, '_blank');
  };

  const clearField = (name) => {
    setData((prev) => ({ ...prev, [name]: '' }));
    setOcrAssistedFields((prev) => ({ ...prev, [name]: false }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-xl shadow border p-4 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Land Use / Zoning Clearance (OCR Assist)</h1>
          <p className="text-sm text-gray-600 mt-2">
            Upload a scanned Zoning/Locational Clearance form. The system will extract text using OCR and suggest values. You must review and confirm before generating any PDF.
          </p>

          <div className="mt-6 p-4 rounded-lg border bg-gray-50">
            <label className="block text-sm font-semibold text-gray-700">1) Upload scanned document</label>
            <input type="file" accept="application/pdf,image/*" className="mt-2" onChange={onFileChange} />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={runOcr}
                disabled={!file || uploading}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold disabled:bg-gray-300"
              >
                {uploading ? 'Running OCR…' : 'Run OCR & Auto-Fill'}
              </button>
            </div>
            {ocrResult?.confidence !== null && (
              <p className="text-xs text-gray-600 mt-2">OCR confidence: {Math.round(ocrResult.confidence)} / 100</p>
            )}
            {!!warnings.length && (
              <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-900">Warnings</p>
                <ul className="text-sm text-amber-900 list-disc ml-5 mt-1">
                  {warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">2) Review & Edit</h2>
              <button
                type="button"
                onClick={() => setData(initialData)}
                className="text-sm px-3 py-2 rounded-md border border-gray-300"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Applicant Name" name="applicantName" value={data.applicantName} onChange={onChange} ocrAssisted={!!ocrAssistedFields.applicantName} />
              <Field label="Project Location" name="projectLocation" value={data.projectLocation} onChange={onChange} ocrAssisted={!!ocrAssistedFields.projectLocation} />
              <Field label="Barangay" name="barangay" value={data.barangay} onChange={onChange} ocrAssisted={!!ocrAssistedFields.barangay} />
              <Field label="City / Municipality" name="cityMunicipality" value={data.cityMunicipality} onChange={onChange} ocrAssisted={!!ocrAssistedFields.cityMunicipality} />
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div>
                  <Field label="Lot Number" name="lotNumber" value={data.lotNumber} onChange={onChange} ocrAssisted={!!ocrAssistedFields.lotNumber} />
                  <button type="button" onClick={() => clearField('lotNumber')} className="mt-1 text-xs text-gray-600 underline">Clear</button>
                </div>
                <div>
                  <Field label="Block Number" name="blockNumber" value={data.blockNumber} onChange={onChange} ocrAssisted={!!ocrAssistedFields.blockNumber} />
                  <button type="button" onClick={() => clearField('blockNumber')} className="mt-1 text-xs text-gray-600 underline">Clear</button>
                </div>
              </div>
              <Field label="Existing Land Use" name="existingLandUse" value={data.existingLandUse} onChange={onChange} ocrAssisted={!!ocrAssistedFields.existingLandUse} />
              <Field label="Zoning Classification" name="zoningClassification" value={data.zoningClassification} onChange={onChange} ocrAssisted={!!ocrAssistedFields.zoningClassification} />
              <Field label="Project Type / Nature" name="projectTypeNature" value={data.projectTypeNature} onChange={onChange} ocrAssisted={!!ocrAssistedFields.projectTypeNature} />
              <Field label="Lot Area" name="lotArea" value={data.lotArea} onChange={onChange} ocrAssisted={!!ocrAssistedFields.lotArea} />
              <Field label="Project Cost" name="projectCost" value={data.projectCost} onChange={onChange} ocrAssisted={!!ocrAssistedFields.projectCost} />
            </div>

            <div className="mt-6 p-4 rounded-lg border bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">3) Confirm & Generate</h3>
              <p className="text-sm text-gray-600 mt-1">
                OCR does not submit anything. You must explicitly confirm the data before generating the filled government-style PDF.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!landUseId}
                  className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-semibold disabled:bg-gray-300"
                >
                  Confirm Extracted Data
                </button>
                <button
                  type="button"
                  onClick={generatePdf}
                  disabled={!confirmed}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold disabled:bg-gray-300"
                >
                  Generate Filled PDF
                </button>
                <button
                  type="button"
                  onClick={openPdf}
                  disabled={!pdfReady}
                  className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold disabled:text-gray-400"
                >
                  Preview / Download PDF
                </button>
              </div>
              {!landUseId && (
                <p className="text-xs text-gray-600 mt-2">Run OCR first to create a draft record.</p>
              )}
              {confirmed && (
                <div className="mt-2">
                  <p className="text-xs text-green-700">Status: Verified</p>
                  {cameFromBuilding && (
                    <button
                      type="button"
                      onClick={() => navigate('/building-application')}
                      className="mt-3 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                      Proceed to Building Application
                    </button>
                  )}
                </div>
              )}
            </div>

            {ocrResult?.rawText && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800">Show raw OCR text</summary>
                <pre className="mt-3 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs whitespace-pre-wrap">{ocrResult.rawText}</pre>
              </details>
            )}

            <div className="mt-6 text-xs text-gray-500">
              <p>
                Note: PDF generation requires an official template PDF at `frontend/public/zoning_locational_clearance_template.pdf` (fillable AcroForm recommended).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
