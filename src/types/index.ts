// Core types for LectorIA

export type FieldType = 'text' | 'date' | 'number' | 'list' | 'boolean';

export interface FieldDefinition {
  key: string;         // e.g. "nombre_solicitante"
  label: string;       // e.g. "Nombre del Solicitante"
  description: string; // e.g. "Nombre completo tal como aparece en el documento"
  type: FieldType;
  required: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  document_type: string; // e.g. "Solicitud de Permiso Comercial"
  fields: FieldDefinition[];
  created_at: string;
  updated_at: string;
}

export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error';

export interface ExtractedField {
  key: string;
  label: string;
  value: string | null;
  confidence: 'high' | 'medium' | 'low' | 'not_found';
  edited?: boolean;
}

export interface Document {
  id: string;
  template_id: string;
  template_name?: string;
  file_name: string;
  storage_path: string;
  status: DocumentStatus;
  extracted_data: ExtractedField[] | null;
  error_message?: string | null;
  created_at: string;
}

export interface GeminiExtractionResult {
  fields: Record<string, string | null>;
  confidence: Record<string, 'high' | 'medium' | 'low' | 'not_found'>;
}
