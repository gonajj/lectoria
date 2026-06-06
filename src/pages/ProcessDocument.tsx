import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, Layers, ChevronDown } from 'lucide-react';
import { getTemplates, saveDocument, generateId } from '../store/templates';
import { extractFieldsFromPDF } from '../services/gemini';
import type { Document, Template } from '../types';

export default function ProcessDocument() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedId = (location.state as { templateId?: string } | null)?.templateId;

  const templates = getTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(preselectedId ?? (templates[0]?.id ?? ''));
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  async function handleProcess() {
    if (!file) { setError('Selecciona un archivo'); return; }
    if (!selectedTemplate) { setError('Selecciona una plantilla'); return; }

    setProcessing(true);
    setError(null);

    const docId = generateId();
    const newDoc: Document = {
      id: docId,
      template_id: selectedTemplate.id,
      template_name: selectedTemplate.name,
      file_name: file.name,
      storage_path: '',
      status: 'processing',
      extracted_data: null,
      created_at: new Date().toISOString(),
    };
    saveDocument(newDoc);

    try {
      const result = await extractFieldsFromPDF(file, selectedTemplate.fields, selectedTemplate.document_type);

      const extractedData = selectedTemplate.fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: result.fields[f.key] ?? null,
        confidence: result.confidence[f.key] ?? 'not_found',
      }));

      const updatedDoc: Document = {
        ...newDoc,
        status: 'done',
        extracted_data: extractedData,
      };
      saveDocument(updatedDoc);
      navigate(`/documents/${docId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al procesar el documento';
      const failedDoc: Document = {
        ...newDoc,
        status: 'error',
        error_message: message,
      };
      saveDocument(failedDoc);
      setError(`Error de Gemini: ${message}`);
      setProcessing(false);
    }
  }

  if (templates.length === 0) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Procesar Documento</h1>
        </div>
        <div className="page-content">
          <div className="empty-state animate-in">
            <div className="empty-state-icon">
              <Layers size={24} color="var(--text-muted)" />
            </div>
            <h3>No hay plantillas</h3>
            <p>Primero debes crear una plantilla para poder procesar documentos.</p>
            <a href="/templates/new" className="btn btn-primary">Crear plantilla</a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Procesar Documento</h1>
        <p className="page-subtitle">
          Sube un documento PDF o imagen — Gemini extraerá automáticamente los campos definidos en la plantilla
        </p>
      </div>

      <div className="page-content">
        {processing ? (
          <ProcessingOverlay fileName={file?.name ?? ''} templateName={selectedTemplate?.name ?? ''} />
        ) : (
          <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Template selector */}
            <div className="card">
              <div className="section-title">1. Selecciona la plantilla</div>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{ appearance: 'none', paddingRight: 36 }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.document_type}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
              </div>
              {selectedTemplate && (
                <div style={{
                  marginTop: 12, padding: '10px 12px',
                  background: 'var(--bg-elevated)', borderRadius: 8,
                  fontSize: 12, color: 'var(--text-muted)',
                }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {selectedTemplate.fields.length} campos
                  </span>
                  {' '}a extraer: {selectedTemplate.fields.map((f) => f.label).join(', ')}
                </div>
              )}
            </div>

            {/* File dropzone */}
            <div className="card">
              <div className="section-title">2. Sube el documento</div>

              {!file ? (
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-icon">
                    <Upload size={36} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra el documento aquí'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    o haz clic para seleccionar — PDF, JPG, PNG · máx 20MB
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px', background: 'var(--bg-elevated)',
                  borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: 'rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={18} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', background: 'var(--danger-bg)',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
                color: 'var(--danger)', fontSize: 13,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {/* Process button */}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleProcess}
              disabled={!file || !selectedTemplateId}
              style={{ alignSelf: 'flex-start' }}
            >
              <Upload size={18} />
              Procesar con Gemini
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ProcessingOverlay({ fileName, templateName }: { fileName: string; templateName: string }) {
  return (
    <div className="card animate-in" style={{ maxWidth: 500 }}>
      <div className="processing-overlay">
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(124,58,237,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 4,
          }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        </div>
        <h3>Analizando documento...</h3>
        <p>
          Gemini está leyendo <strong style={{ color: 'var(--text-secondary)' }}>{fileName}</strong>
          <br />
          y extrayendo los campos de la plantilla <strong style={{ color: 'var(--accent)' }}>{templateName}</strong>
          <br />
          <span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
            Esto puede tomar unos segundos dependiendo del tamaño del documento
          </span>
        </p>
      </div>
    </div>
  );
}
