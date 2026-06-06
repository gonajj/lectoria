import { createClient } from '@supabase/supabase-js';
import type { Template, Document, ExtractedField, DocumentStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTemplate(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createTemplate(
  template: Omit<Template, 'id' | 'created_at' | 'updated_at'>
): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .insert([template])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(
  id: string,
  template: Partial<Omit<Template, 'id' | 'created_at' | 'updated_at'>>
): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .update({ ...template, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) throw error;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select(`*, templates(name)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d) => ({
    ...d,
    template_name: d.templates?.name,
  }));
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select(`*, templates(name, fields, document_type)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return {
    ...data,
    template_name: data.templates?.name,
  };
}

export async function createDocument(doc: {
  template_id: string;
  file_name: string;
  storage_path: string;
}): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert([{ ...doc, status: 'pending' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  extracted_data?: ExtractedField[],
  error_message?: string
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ status, extracted_data: extracted_data || null, error_message: error_message || null })
    .eq('id', id);
  if (error) throw error;
}

export async function updateExtractedData(
  id: string,
  extracted_data: ExtractedField[]
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ extracted_data })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export async function uploadPDF(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return data.path;
}

export async function getPDFUrl(path: string): Promise<string> {
  const { data } = supabase.storage.from('documents').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Local storage fallback (when Supabase not configured) ───────────────────

const isSupabaseConfigured = () =>
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

export { isSupabaseConfigured };

// Local template storage (for demo without Supabase)
const LOCAL_TEMPLATES_KEY = 'lectoria_templates';
const LOCAL_DOCUMENTS_KEY = 'lectoria_documents';

export function getLocalTemplates(): Template[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TEMPLATES_KEY) || '[]');
  } catch { return []; }
}

export function saveLocalTemplate(template: Template): void {
  const templates = getLocalTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) templates[idx] = template;
  else templates.unshift(template);
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
}

export function deleteLocalTemplate(id: string): void {
  const templates = getLocalTemplates().filter((t) => t.id !== id);
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
}

export function getLocalDocuments(): Document[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DOCUMENTS_KEY) || '[]');
  } catch { return []; }
}

export function saveLocalDocument(doc: Document): void {
  const docs = getLocalDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.unshift(doc);
  localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(docs));
}
