import React, { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { LAND_USE_FIELDS, PERSISTED_LAND_USE_KEYS, makeInitialLandUseData } from './landUseFields';

const Field = ({ label, name, value, onChange, status }) => {
  const isDetected = status === 'detected';
  const isMissing = status === 'missing';

  return (
    <div
      className={`p-3 rounded-lg border ${
        isDetected ? 'border-amber-400 bg-amber-50' : isMissing ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={isMissing ? 'Not detected from document' : isDetected ? 'Extracted from document — please verify' : ''}
      />
      {isDetected && <p className="text-xs text-amber-700 mt-1">Extracted (editable)</p>}
      {isMissing && <p className="text-xs text-red-700 mt-1">Not detected (please provide/correct)</p>}
    </div>
  );
};

export default function LandUseOcrAssist() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromBuilding = location?.state?.from === 'building';

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Step state: upload -> review -> confirmed
  const [step, setStep] = useState('upload'); // 'upload' | 'review'

  const [ocrResult, setOcrResult] = useState(null);
  const [data, setData] = useState(makeInitialLandUseData());
  const [fieldStatus, setFieldStatus] = useState({}); // key -> 'detected' | 'missing' | undefined
  const [warnings, setWarnings] = useState([]);

  const [landUseId, setLandUseId] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  const headers = useMemo(
    () => ({ headers: { Authorization: `Bearer ${auth?.accessToken}` } }),
    [auth]
  );

  const resetAll = () => {
    setFile(null);
    setUploading(false);
    setStep('upload');
    setOcrResult(null);
    setData(makeInitialLandUseData());
    setFieldStatus({});
    setWarnings([]);
    setLandUseId(null);
    setConfirmed(false);
    setPdfReady(false);
  };

  const onFileChange = async (e) => {
    const f = e.target.files?.[0] || null;
    resetAll();
    if (!f) return;
    setFile(f);
    // Immediately run OCR after upload (document-first)
    await runOcr(f);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setPdfReady(false);
  };

  const runOcr = async (fileToProcess) => {
    const f = fileToProcess || file;
    if (!f) return;

    setUploading(true);
    setStep('upload');
    try {
      const form = new FormData();
      form.append('file', f);

      const res = await axios.post('/api/pre-application/ocr/upload', form, {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Backend contract (document-first)
      const detectedFields = res.data?.detectedFields || {};
      const missingFields = res.data?.missingFields || [];
      const confidenceScores = res.data?.confidenceScores || {};

      setOcrResult(res.data);
      setWarnings(res.data?.warnings || []);

      const nextData = { ...makeInitialLandUseData(), ...detectedFields };
      setData(nextData);

      const statusMap = {};
      for (const k of Object.keys(nextData)) {
        if (missingFields.includes(k)) statusMap[k] = 'missing';
        else if (detectedFields?.[k]) statusMap[k] = 'detected';
      }
      // If the backend sent a score map, treat score==1 as detected highlight
      for (const [k, s] of Object.entries(confidenceScores)) {
        if (s === 1 && nextData[k]) statusMap[k] = 'detected';
      }
      setFieldStatus(statusMap);

      setStep('review');

      // Create a Draft record immediately (safe, isolated) so user can come back later.
      const persisted = Object.fromEntries(
        Object.entries(nextData).filter(([k]) => PERSISTED_LAND_USE_KEYS.includes(k))
      );

      const draft = await axios.post(
        '/api/pre-application/land-use',
        {
          data: persisted,
          ocr: {
            rawText: res.data?.rawText || '',
            confidence: res.data?.confidence ?? null,
            warnings: res.data?.warnings || [],
            uploadedFileName: f.name,
            uploadedMimeType: f.type,
            extractedAt: new Date().toISOString()
          }
        },
        headers
      );

      setLandUseId(draft.data?.landUseApplication?._id || null);
    } catch (err) {
      console.error(err);

      // If backend returned partial result with non-2xx status, we still want to show review.
      const partial = err?.response?.data;
      if (partial?.rawText || partial?.detectedFields) {
        // Document requirement enforcement: if server rejected the document type, do not show the review form.
        if (String(partial?.message || '').toLowerCase().includes('does not appear')) {
          setOcrResult(partial);
          setWarnings(partial?.warnings || [partial?.message].filter(Boolean));
          setStep('upload');
          return;
        }

        setOcrResult(partial);
        setWarnings(partial?.warnings || [partial?.message].filter(Boolean));

        const detectedFields = partial?.detectedFields || {};
        const missingFields = partial?.missingFields || [];

        const nextData = { ...makeInitialLandUseData(), ...detectedFields };
        setData(nextData);

        const statusMap = {};
        for (const k of Object.keys(nextData)) {
          if (missingFields.includes(k)) statusMap[k] = 'missing';
          else if (detectedFields?.[k]) statusMap[k] = 'detected';
        }
        setFieldStatus(statusMap);
        setStep('review');
      } else {
        alert(err.response?.data?.message || 'OCR failed. Please try again with a clearer scan.');
      }
    } finally {
      setUploading(false);
    }
  };

  const saveEdits = async () => {
    if (!landUseId) return alert('No draft record found yet. Please upload a document first.');

    const persisted = Object.fromEntries(
      Object.entries(data || {}).filter(([k]) => PERSISTED_LAND_USE_KEYS.includes(k))
    );

    await axios.put(`/api/pre-application/land-use/${landUseId}`, { data: persisted }, headers);
  };

  const confirm = async () => {
    if (!landUseId) return alert('No draft record found yet. Please upload a document first.');
    try {
      await saveEdits();
      const persisted = Object.fromEntries(
        Object.entries(data || {}).filter(([k]) => PERSISTED_LAND_USE_KEYS.includes(k))
      );
      await axios.post(`/api/pre-application/land-use/${landUseId}/confirm`, { data: persisted }, headers);
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
    setFieldStatus((prev) => ({ ...prev, [name]: 'missing' }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-xl shadow border p-4 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Land Use / Zoning Clearance (OCR Assist)</h1>
          <p className="text-sm text-gray-600 mt-2">
            Upload a scanned Land Use / Zoning / Locational Clearance document. The document is the source of truth; the form only reflects what was extracted so you can verify and correct it.
          </p>

          {/* STEP 1: Upload only */}
          <div className="mt-6 p-4 rounded-lg border bg-gray-50">
            <label className="block text-sm font-semibold text-gray-700">Step 1 — Upload Clearance Document (Required)</label>
            <p className="text-xs text-gray-600 mt-1">
              Upload an actual scanned Land Use / Zoning / Locational Clearance document. OCR runs automatically after upload.
            </p>
            <input type="file" accept="application/pdf,image/*" className="mt-3" onChange={onFileChange} />

            {uploading && (
              <p className="text-sm text-gray-700 mt-3">Running OCR… please wait.</p>
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

            {typeof ocrResult?.confidence === 'number' && (
              <p className="text-xs text-gray-600 mt-2">OCR confidence: {Math.round(ocrResult.confidence)} / 100</p>
            )}
            {!!ocrResult?.documentType && (
              <p className="text-xs text-gray-600 mt-1">Detected document type: {ocrResult.documentType}</p>
            )}

            {/* Document-first rule: no form until OCR has run */}
            {step === 'upload' && !uploading && !file && (
              <p className="text-xs text-gray-600 mt-3">No document uploaded yet.</p>
            )}
          </div>

          {/* STEP 3: Review */}
          {step === 'review' && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Step 3 — Review Extracted Data</h2>
                <button
                  type="button"
                  onClick={() => setData(makeInitialLandUseData())}
                  className="text-sm px-3 py-2 rounded-md border border-gray-300"
                >
                  Clear All
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                The document is the source of truth. The fields below reflect what was detected. Please verify and correct anything.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {LAND_USE_FIELDS.map((f) => (
                  <Field
                    key={f.key}
                    label={f.label}
                    name={f.key}
                    value={data[f.key]}
                    onChange={onChange}
                    status={fieldStatus[f.key]}
                  />
                ))}
              </div>

              <div className="mt-2">
                <button type="button" onClick={() => clearField('lotNumber')} className="text-xs text-gray-600 underline mr-3">Clear Lot Number</button>
                <button type="button" onClick={() => clearField('blockNumber')} className="text-xs text-gray-600 underline">Clear Block Number</button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="mt-6 p-4 rounded-lg border bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Step 4 — Confirm & Generate</h3>
              <p className="text-sm text-gray-600 mt-1">
                OCR does not submit anything. You must explicitly confirm the data before generating the filled government-style PDF.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!landUseId || step !== 'review'}
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
                <p className="text-xs text-gray-600 mt-2">Upload a clearance document first to create a draft record.</p>
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
          )}

          {ocrResult?.rawText && step === 'review' && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-gray-800">Show raw OCR text</summary>
              <pre className="mt-3 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs whitespace-pre-wrap">
                {ocrResult.rawText}
              </pre>
            </details>
          )}

          <div className="mt-6 text-xs text-gray-500">
            <p>
              Note: PDF generation requires an official template PDF at{' '}
              <code>frontend/public/zoning_locational_clearance_template.pdf</code> (fillable AcroForm recommended).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
