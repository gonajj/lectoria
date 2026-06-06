import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertCircle, Download,
  Pencil, Save, X, Copy, Check,
} from 'lucide-react';
import { getDocuments, saveDocument } from '../store/templates';
import type { Document, ExtractedField } from '../types';

const CONFIDENCE_META: Record<string, { label: string; cls: string }> = {
  high:      { label: 'Alta confianza',   cls: 'confidence-high'      },
  medium:    { label: 'Confianza media',  cls: 'confidence-medium'    },
  low:       { label: 'Baja confianza',   cls: 'confidence-low'       },
  not_found: { label: 'No encontrado',    cls: 'confidence-not_found' },
};

export default function DocumentResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Document | null>(() =>
    getDocuments().find((d) => d.id === id) ?? null
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!doc) {
    return (
      <div className="page-content" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <h3>Documento no encontrado</h3>
          <Link to="/history" className="btn btn-secondary">Ver historial</Link>
        </div>
      </div>
    );
  }

  const fields = doc.extracted_data ?? [];
  const highCount   = fields.filter((f) => f.confidence === 'high').length;
  const mediumCount = fields.filter((f) => f.confidence === 'medium').length;
  const lowCount    = fields.filter((f) => f.confidence === 'low').length;
  const notFound    = fields.filter((f) => f.confidence === 'not_found').length;

  function startEdit(field: ExtractedField) {
    setEditingKey(field.key);
    setEditValue(field.value ?? '');
  }

  function saveEdit(key: string) {
    if (!doc) return;
    const updated: Document = {
      ...doc,
      extracted_data: (doc.extracted_data ?? []).map((f) =>
        f.key === key ? { ...f, value: editValue, edited: true } : f
      ),
    };
    saveDocument(updated);
    setDoc(updated);
    setEditingKey(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportJSON() {
    if (!doc?.extracted_data) return;
    const obj: Record<string, string | null> = {};
    doc.extracted_data.forEach((f) => { obj[f.key] = f.value; });
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.file_name.replace(/\.[^.]+$/, '')}_extraido.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyJSON() {
    if (!doc?.extracted_data) return;
    const obj: Record<string, string | null> = {};
    doc.extracted_data.forEach((f) => { obj[f.key] = f.value; });
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            <ArrowLeft size={15} /> Historial
          </button>
          {saved && (
            <span className="badge badge-success">
              <Check size={11} /> Guardado
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title" style={{ fontSize: 20 }}>{doc.file_name}</h1>
            <p className="page-subtitle">
              Plantilla: {doc.template_name} ·{' '}
              {new Date(doc.created_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={copyJSON}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar JSON'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={exportJSON}>
              <Download size={14} /> Exportar JSON
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {doc.status === 'error' ? (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '16px', background: 'var(--danger-bg)',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12,
            color: 'var(--danger)',
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Error al procesar</div>
              <div style={{ fontSize: 13 }}>{doc.error_message}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Confidence summary */}
            <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
              <ConfStat count={highCount}   label="Alta confianza"  color="var(--success)" />
              <ConfStat count={mediumCount} label="Media confianza" color="var(--warning)" />
              <ConfStat count={lowCount}    label="Baja confianza"  color="var(--danger)"  />
              <ConfStat count={notFound}    label="No encontrado"   color="var(--text-muted)" />
            </div>

            {/* Fields grid */}
            <div className="result-grid">
              {fields.map((field) => {
                const conf = CONFIDENCE_META[field.confidence] ?? CONFIDENCE_META.not_found;
                const isEditing = editingKey === field.key;

                return (
                  <div
                    key={field.key}
                    className="result-field animate-in"
                    style={{
                      borderColor: field.confidence === 'low' || field.confidence === 'not_found'
                        ? 'rgba(239,68,68,0.2)'
                        : field.edited ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="result-field-label">{field.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {field.edited && (
                          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>
                            EDITADO
                          </span>
                        )}
                        {!isEditing && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '2px 6px' }}
                            onClick={() => startEdit(field)}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="editable-value"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(field.key);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                        <button className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => saveEdit(field.key)}>
                          <Save size={13} />
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setEditingKey(null)}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className={`result-field-value ${!field.value ? 'empty' : ''}`}>
                        {field.value ?? '— no encontrado —'}
                      </div>
                    )}

                    <div className={`result-field-confidence ${conf.cls}`}>
                      {field.confidence === 'high' && <CheckCircle size={11} />}
                      {field.confidence === 'not_found' && <AlertCircle size={11} />}
                      {conf.label}
                      {' · '}
                      <code style={{ fontSize: 10, opacity: 0.7 }}>{field.key}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ConfStat({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      fontSize: 12,
    }}>
      <span style={{ fontWeight: 800, color, fontSize: 16 }}>{count}</span>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
