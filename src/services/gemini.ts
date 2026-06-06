import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FieldDefinition, GeminiExtractionResult } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Convert PDF file to base64 for Gemini
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractFieldsFromPDF(
  file: File,
  fields: FieldDefinition[],
  documentType: string
): Promise<GeminiExtractionResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const base64Data = await fileToBase64(file);

  const fieldsList = fields
    .map((f) => `- "${f.key}" (${f.label}): ${f.description}. Tipo: ${f.type}. ${f.required ? 'REQUERIDO.' : 'Opcional.'}`)
    .join('\n');

  const prompt = `Eres un experto en lectura y análisis de documentos oficiales gubernamentales mexicanos, especialmente de SEDECO.

Analiza el documento de tipo "${documentType}" y extrae los siguientes campos con precisión:

CAMPOS A EXTRAER:
${fieldsList}

INSTRUCCIONES IMPORTANTES:
1. Lee el documento completo con atención.
2. Extrae EXACTAMENTE los valores que aparecen en el documento.
3. Para campos de tipo "date", usa formato DD/MM/YYYY.
4. Para campos de tipo "number", devuelve solo el número sin formato de moneda ni símbolos.
5. Para campos de tipo "boolean", devuelve "Sí" o "No".
6. Para campos de tipo "list", separa los valores con coma.
7. Si un campo no está presente en el documento, usa null.
8. Evalúa tu confianza en cada extracción: "high" si el valor es claro, "medium" si inferido, "low" si dudoso, "not_found" si no existe.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "fields": {
    "nombre_del_campo": "valor_extraído_o_null"
  },
  "confidence": {
    "nombre_del_campo": "high|medium|low|not_found"
  }
}`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
        data: base64Data,
      },
    },
    { text: prompt },
  ]);

  const responseText = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                    responseText.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error('Gemini no devolvió un JSON válido');
  }

  const parsed: GeminiExtractionResult = JSON.parse(jsonMatch[1]);
  return parsed;
}
