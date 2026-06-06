import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ArrowLeft, Save } from 'lucide-react';
import { getTemplateById, saveTemplate, generateId } from '../store/templates';
import type { FieldDefinition, FieldType, Template } from '../types';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',    label: 'Texto' },
  { value: 'date',    label: 'Fecha' },
  { value: 'number',  label: 'Número' },
  { value: 'list',    label: 'Lista' },
  { value: 'boolean', label: 'Sí/No' },
];

const EMPTY_FIELD = (): FieldDefinition => ({
  key: '',
  label: '',
  description: '',
  type: 'text',
  required: true,
});

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [fields, setFields] = useState<FieldDefinition[]>([EMPTY_FIELD()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const t = getTemplateById(id);
      if (t) {
        setName(t.name);
        setDescription(t.description);
        setDocumentType(t.document_type);
        setFields(t.fields.length > 0 ? t.fields : [EMPTY_FIELD()]);
      }
    }
  }, [id]);

  function addField() {
    setFields((prev) => [...prev, EMPTY_FIELD()]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<FieldDefinition>) {
    setFields((prev) => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
  }

  // Auto-generate key from label
  function handleLabelChange(index: number, value: string) {
    const key = value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    updateField(index, { label: value, key });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim())         newErrors.name = 'El nombre es requerido';
    if (!documentType.trim()) newErrors.documentType = 'El tipo de documento es requerido';
    if (fields.length === 0)  newErrors.fields = 'Agrega al menos un campo';

    fields.forEach((f, i) => {
      if (!f.label.trim()) newErrors[`field_${i}_label`] = 'Nombre del campo requerido';
      if (!f.key.trim())   newErrors[`field_${i}_key`]   = 'Clave requerida';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const template: Template = {
      id:          id ?? generateId(),
      name:        name.trim(),
      description: description.trim(),
      document_type: documentType.trim(),
      fields,
      created_at: isEdit ? (getTemplateById(id!)?.created_at ?? now) : now,
      updated_at: now,
    };
    saveTemplate(template);
    navigate('/templates');
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/templates')}>
            <ArrowLeft size={15} /> Volver
          </button>
        </div>
        <h1 className="page-title">{isEdit ? 'Editar plantilla' : 'Nueva plantilla'}</h1>
        <p className="page-subtitle">
          Define el tipo de documento y los campos que Gemini debe extraer automáticamente
        </p>
      </div>

      <div className="page-content">
        <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* General info */}
          <div className="card">
            <div className="section-title">Información general</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre de la plantilla *</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Solicitud de Permiso Comercial"
                />
                {errors.name && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de documento *</label>
                <input
                  className="form-input"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  placeholder="Ej: Permiso Comercial, Licencia de Operación..."
                />
                {errors.documentType && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.documentType}</span>}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve sobre para qué sirve esta plantilla..."
                rows={2}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-title" style={{ margin: 0 }}>Campos a extraer</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Cada campo es una variable que Gemini buscará en el documento
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={addField}>
                <Plus size={14} /> Agregar campo
              </button>
            </div>

            {errors.fields && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{errors.fields}</div>
            )}

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 3fr 120px 80px 36px',
              gap: 10,
              padding: '0 14px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              <span>Nombre visible</span>
              <span>Clave (key)</span>
              <span>Descripción / Hint para IA</span>
              <span>Tipo</span>
              <span>Requerido</span>
              <span></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((field, i) => (
                <div key={i} className="field-row animate-in">
                  <div className="form-group" style={{ margin: 0 }}>
                    <input
                      className="form-input"
                      value={field.label}
                      onChange={(e) => handleLabelChange(i, e.target.value)}
                      placeholder="Nombre del solicitante"
                    />
                    {errors[`field_${i}_label`] && (
                      <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors[`field_${i}_label`]}</span>
                    )}
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <input
                      className="form-input"
                      value={field.key}
                      onChange={(e) => updateField(i, { key: e.target.value })}
                      placeholder="nombre_solicitante"
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <input
                      className="form-input"
                      value={field.description}
                      onChange={(e) => updateField(i, { description: e.target.value })}
                      placeholder="Nombre completo tal como aparece firmado"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <select
                      className="form-select"
                      value={field.type}
                      onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 2 }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(i, { required: e.target.checked })}
                    />
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '6px', color: 'var(--danger)' }}
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
                No hay campos. Agrega al menos uno.
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
              {isEdit ? 'Guardar cambios' : 'Crear plantilla'}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/templates')}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
