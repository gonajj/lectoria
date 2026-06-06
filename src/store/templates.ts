import type { Template, Document } from '../types';

const TEMPLATES_KEY = 'lectoria_templates';
const DOCUMENTS_KEY = 'lectoria_documents';

// ─── Templates ────────────────────────────────────────────────────────────────

export function getTemplates(): Template[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveTemplate(template: Template): void {
  const all = getTemplates();
  const idx = all.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    all[idx] = template;
  } else {
    all.unshift(template);
  }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all));
}

export function deleteTemplate(id: string): void {
  const all = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all));
}

export function getTemplateById(id: string): Template | undefined {
  return getTemplates().find((t) => t.id === id);
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function getDocuments(): Document[] {
  try {
    return JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveDocument(doc: Document): void {
  const all = getDocuments();
  const idx = all.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    all[idx] = doc;
  } else {
    all.unshift(doc);
  }
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
}

export function deleteDocument(id: string): void {
  const all = getDocuments().filter((d) => d.id !== id);
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
