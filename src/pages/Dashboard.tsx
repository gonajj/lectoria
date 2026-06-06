import { Link } from 'react-router-dom';
import { Layers, Upload, CheckCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import { getTemplates, getDocuments } from '../store/templates';

export default function Dashboard() {
  const templates = getTemplates();
  const documents = getDocuments();

  const done    = documents.filter((d) => d.status === 'done').length;
  const pending = documents.filter((d) => d.status === 'pending' || d.status === 'processing').length;
  const recent  = documents.slice(0, 5);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Bienvenido a LectorIA — Procesamiento inteligente de documentos SEDECO</p>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Layers size={18} color="var(--accent)" />
            </div>
            <div className="stat-value">{templates.length}</div>
            <div className="stat-label">Plantillas activas</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle size={18} color="var(--success)" />
            </div>
            <div className="stat-value">{done}</div>
            <div className="stat-label">Documentos procesados</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Clock size={18} color="var(--warning)" />
            </div>
            <div className="stat-value">{pending}</div>
            <div className="stat-label">En proceso</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <FileText size={18} color="var(--info)" />
            </div>
            <div className="stat-value">{documents.length}</div>
            <div className="stat-label">Total de documentos</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-6">
          <Link to="/upload" className="btn btn-primary btn-lg">
            <Upload size={18} />
            Procesar nuevo documento
          </Link>
          <Link to="/templates/new" className="btn btn-secondary btn-lg">
            <Layers size={18} />
            Nueva plantilla
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Recent docs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="section-title" style={{ margin: 0 }}>Documentos recientes</div>
              <Link to="/history" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            {recent.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Aún no hay documentos procesados
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recent.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 8,
                      transition: 'all 200ms',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {doc.file_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {doc.template_name} · {new Date(doc.created_at).toLocaleDateString('es-MX')}
                        </div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Templates list */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="section-title" style={{ margin: 0 }}>Plantillas</div>
              <Link to="/templates" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                Administrar <ArrowRight size={13} />
              </Link>
            </div>
            {templates.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                No hay plantillas aún.{' '}
                <Link to="/templates/new" style={{ color: 'var(--accent)' }}>Crea la primera</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.slice(0, 5).map((t) => (
                  <div key={t.id} style={{
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.fields.length} campos · {t.document_type}
                      </div>
                    </div>
                    <Link to="/upload" className="btn btn-primary btn-sm">
                      Usar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    done:       { label: 'Listo',     cls: 'badge-success' },
    processing: { label: 'Procesando',cls: 'badge-info'    },
    pending:    { label: 'Pendiente', cls: 'badge-warning' },
    error:      { label: 'Error',     cls: 'badge-danger'  },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-muted' };
  return <span className={`badge ${cls}`}>{label}</span>;
}
