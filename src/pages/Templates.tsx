import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Layers, Pencil, Trash2, Upload, FileText } from 'lucide-react';
import { getTemplates, deleteTemplate } from '../store/templates';
import type { Template } from '../types';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>(() => getTemplates());
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar la plantilla "${name}"? Esta acción no se puede deshacer.`)) return;
    deleteTemplate(id);
    setTemplates(getTemplates());
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Plantillas</h1>
            <p className="page-subtitle">Define qué campos extraer de cada tipo de documento</p>
          </div>
          <Link to="/templates/new" className="btn btn-primary">
            <Plus size={16} />
            Nueva plantilla
          </Link>
        </div>
      </div>

      <div className="page-content">
        {templates.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-state-icon">
              <Layers size={24} color="var(--text-muted)" />
            </div>
            <h3>Sin plantillas aún</h3>
            <p>
              Crea una plantilla para cada tipo de documento que manejas en SEDECO.
              <br />
              Define los campos que quieres extraer automáticamente.
            </p>
            <Link to="/templates/new" className="btn btn-primary">
              <Plus size={16} />
              Crear primera plantilla
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {templates.map((t) => (
              <div key={t.id} className="card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(99,102,241,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={18} color="var(--accent)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="card-title" style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.name}
                    </div>
                    <div className="card-meta">{t.document_type}</div>
                  </div>
                </div>

                {/* Description */}
                {t.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {t.description}
                  </p>
                )}

                {/* Fields preview */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {t.fields.slice(0, 6).map((f) => (
                    <span key={f.key} style={{
                      fontSize: 11, background: 'var(--bg-elevated)',
                      color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 20,
                      border: '1px solid var(--border)',
                    }}>
                      {f.label}
                    </span>
                  ))}
                  {t.fields.length > 6 && (
                    <span style={{
                      fontSize: 11, color: 'var(--accent)',
                      padding: '2px 8px',
                    }}>
                      +{t.fields.length - 6} más
                    </span>
                  )}
                </div>

                <div className="divider" style={{ margin: '4px 0' }} />

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to="/upload" state={{ templateId: t.id }} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <Upload size={13} /> Usar
                  </Link>
                  <Link to={`/templates/${t.id}/edit`} className="btn btn-secondary btn-sm">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(t.id, t.name)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
