import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Eye, Search, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { getDocuments, deleteDocument } from '../store/templates';
import type { Document } from '../types';

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  done:       { label: 'Procesado', cls: 'badge-success', icon: <CheckCircle size={11} /> },
  processing: { label: 'Procesando', cls: 'badge-info',  icon: <Loader2 size={11} />     },
  pending:    { label: 'Pendiente',  cls: 'badge-warning',icon: <Clock size={11} />       },
  error:      { label: 'Error',      cls: 'badge-danger', icon: <AlertCircle size={11} /> },
};

export default function History() {
  const [docs, setDocs] = useState<Document[]>(() => getDocuments());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = docs.filter((d) => {
    const matchSearch = d.file_name.toLowerCase().includes(search.toLowerCase()) ||
                        (d.template_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.status === filter;
    return matchSearch && matchFilter;
  });

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el documento "${name}" del historial?`)) return;
    deleteDocument(id);
    setDocs(getDocuments());
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Historial de documentos</h1>
        <p className="page-subtitle">Todos los documentos procesados con LectorIA</p>
      </div>

      <div className="page-content">
        {/* Toolbar */}
        <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }} />
            <input
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o plantilla..."
              style={{ paddingLeft: 34 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'done', 'error', 'pending'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'Todos' : STATUS_META[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-state-icon">
              <FileText size={24} color="var(--text-muted)" />
            </div>
            <h3>{docs.length === 0 ? 'Sin documentos procesados' : 'Sin resultados'}</h3>
            <p>
              {docs.length === 0
                ? 'Cuando proceses un documento aparecerá aquí.'
                : 'Prueba con otro filtro o término de búsqueda.'}
            </p>
            {docs.length === 0 && (
              <Link to="/upload" className="btn btn-primary">Procesar primer documento</Link>
            )}
          </div>
        ) : (
          <div className="table-container animate-in">
            <table className="table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Plantilla</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Campos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const meta = STATUS_META[doc.status] ?? STATUS_META.pending;
                  const doneFields = (doc.extracted_data ?? []).filter(
                    (f) => f.value && f.confidence !== 'not_found'
                  ).length;
                  const totalFields = (doc.extracted_data ?? []).length;

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(99,102,241,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <FileText size={14} color="var(--accent)" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                              {doc.file_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{doc.template_name ?? '—'}</td>
                      <td>
                        {new Date(doc.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span className={`badge ${meta.cls}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td>
                        {totalFields > 0 ? (
                          <span style={{ fontSize: 13 }}>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{doneFields}</span>
                            <span style={{ color: 'var(--text-muted)' }}>/{totalFields}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {doc.status === 'done' && (
                            <Link to={`/documents/${doc.id}`} className="btn btn-secondary btn-sm">
                              <Eye size={13} /> Ver
                            </Link>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(doc.id, doc.file_name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
