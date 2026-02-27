import { GoogleGenAI, Type } from "@google/genai";
import { SupplierOffer, AnalysisResult } from "../types";

// Initialize Gemini Client
const ENV_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const STORAGE_API_KEY_KEY = 'smartprocure_gemini_api_key';
const STORED_API_KEY = typeof window !== 'undefined'
  ? (localStorage.getItem(STORAGE_API_KEY_KEY) || '').trim()
  : '';
const apiKey = ENV_API_KEY || STORED_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- Simple In-Memory Cache ---
const analysisCache = new Map<string, AnalysisResult>();
const MAX_CACHE_ENTRIES = 24;

// Define Stages for UI feedback
export type AnalysisStage = 'READING_FILES' | 'SENDING_REQUEST' | 'PROCESSING_RESPONSE';
export type ProcurementPriority = 'price' | 'quality' | 'deadline';

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanText = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  return value.replace(/\s+/g, ' ').trim();
};

const normalizeCurrency = (raw: unknown, defaultCurrency: string) => {
  const value = cleanText(raw, '').toUpperCase();
  if (!value) return defaultCurrency.toUpperCase();
  if (value === 'FCFA' || value === 'CFA') return 'XOF';
  return value;
};

const normalizeStringList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .map((item) => cleanText(item, ''))
    .filter((item) => item.length > 0);
  return list.length ? list.slice(0, 6) : fallback;
};

const sanitizeOffer = (
  rawOffer: any,
  index: number,
  targetCurrency: string,
  language: 'fr' | 'en'
): SupplierOffer => {
  const supplierName = cleanText(rawOffer?.supplierName, '') || `${language === 'fr' ? 'Fournisseur' : 'Supplier'} ${index + 1}`;
  let totalPriceHT = Math.max(0, toFiniteNumber(rawOffer?.totalPriceHT, 0));
  let totalPriceTTC = Math.max(0, toFiniteNumber(rawOffer?.totalPriceTTC, 0));

  if (totalPriceHT > 0 && totalPriceTTC <= 0) {
    totalPriceTTC = Math.round(totalPriceHT * 1.18);
  }
  if (totalPriceTTC > 0 && totalPriceHT <= 0) {
    totalPriceHT = Math.round(totalPriceTTC / 1.18);
  }
  if (totalPriceTTC < totalPriceHT) {
    totalPriceTTC = totalPriceHT;
  }

  const technicalScore = clampNumber(Math.round(toFiniteNumber(rawOffer?.technicalScore, 60)), 0, 100);
  const complianceScore = clampNumber(Math.round(toFiniteNumber(rawOffer?.complianceScore, 60)), 0, 100);

  return {
    supplierName,
    nif: cleanText(rawOffer?.nif, '') || undefined,
    email: cleanText(rawOffer?.email, '') || undefined,
    phone: cleanText(rawOffer?.phone, '') || undefined,
    address: cleanText(rawOffer?.address, '') || undefined,
    totalPriceHT,
    totalPriceTTC,
    currency: normalizeCurrency(rawOffer?.currency, targetCurrency),
    originalTotalPriceHT: Math.max(0, toFiniteNumber(rawOffer?.originalTotalPriceHT, 0)),
    originalTotalPriceTTC: Math.max(0, toFiniteNumber(rawOffer?.originalTotalPriceTTC, 0)),
    originalCurrency: cleanText(rawOffer?.originalCurrency, '') || undefined,
    warrantyMonths: clampNumber(Math.round(toFiniteNumber(rawOffer?.warrantyMonths, 0)), 0, 120),
    deliveryDays: clampNumber(Math.round(toFiniteNumber(rawOffer?.deliveryDays, 0)), 0, 365),
    technicalScore,
    complianceScore,
    strengths: normalizeStringList(rawOffer?.strengths, [language === 'fr' ? 'Offre exploitable.' : 'Offer is usable.']),
    weaknesses: normalizeStringList(rawOffer?.weaknesses, [language === 'fr' ? 'Aucun risque majeur détecté.' : 'No major risk detected.']),
    recommendation: cleanText(rawOffer?.recommendation, language === 'fr' ? 'Recommandation indisponible.' : 'Recommendation unavailable.'),
    mainSpecs: cleanText(rawOffer?.mainSpecs, language === 'fr' ? 'Spécifications non détaillées.' : 'Specifications not detailed.')
  };
};

const dedupeOffers = (offers: SupplierOffer[]) => {
  const byName = new Map<string, SupplierOffer>();
  offers.forEach((offer) => {
    const key = cleanText(offer.supplierName, '').toLowerCase();
    if (!key) return;
    const existing = byName.get(key);
    if (!existing || offer.totalPriceTTC < existing.totalPriceTTC) {
      byName.set(key, offer);
    }
  });
  return Array.from(byName.values());
};

const resolvePriorityWeights = (priority: ProcurementPriority | undefined) => {
  switch (priority) {
    case 'deadline':
      return { price: 0.2, technical: 0.25, compliance: 0.15, delivery: 0.4 };
    case 'quality':
      return { price: 0.25, technical: 0.45, compliance: 0.3, delivery: 0.0 };
    case 'price':
    default:
      return { price: 0.55, technical: 0.3, compliance: 0.15, delivery: 0.0 };
  }
};

const findBestOption = (offers: SupplierOffer[], priorityHint?: ProcurementPriority) => {
  if (!offers.length) return 'N/A';
  const minPrice = Math.min(...offers.map((offer) => Math.max(offer.totalPriceTTC, 1)));
  const minDelivery = Math.min(...offers.map((offer) => Math.max(offer.deliveryDays, 1)));
  const weights = resolvePriorityWeights(priorityHint);

  let best = offers[0];
  let bestScore = -Infinity;

  offers.forEach((offer) => {
    const priceScore = (minPrice / Math.max(offer.totalPriceTTC, 1)) * 100;
    const deliveryScore = (minDelivery / Math.max(offer.deliveryDays || 1, 1)) * 100;
    const globalScore = (
      priceScore * weights.price +
      offer.technicalScore * weights.technical +
      offer.complianceScore * weights.compliance +
      deliveryScore * weights.delivery
    );
    if (globalScore > bestScore) {
      best = offer;
      bestScore = globalScore;
    }
  });

  return best.supplierName;
};

const normalizeResult = (
  rawData: any,
  fallbackTitle: string,
  fallbackNeeds: string,
  targetCurrency: string,
  language: 'fr' | 'en',
  priorityHint?: ProcurementPriority
): Omit<AnalysisResult, 'id' | 'date'> => {
  const rawOffers = Array.isArray(rawData?.offers) ? rawData.offers : [];
  const sanitizedOffers = dedupeOffers(rawOffers.map((offer: any, index: number) => (
    sanitizeOffer(offer, index, targetCurrency, language)
  )));

  const modelBest = cleanText(rawData?.bestOption, '');
  const matchedBest = sanitizedOffers.find((offer) => (
    cleanText(offer.supplierName, '').toLowerCase() === modelBest.toLowerCase()
  ));
  const resolvedBestOption = matchedBest
    ? matchedBest.supplierName
    : findBestOption(sanitizedOffers, priorityHint);

  return {
    title: fallbackTitle,
    needsSummary: cleanText(rawData?.needsSummary, fallbackNeeds),
    offers: sanitizedOffers,
    bestOption: resolvedBestOption || "N/A",
    marketAnalysis: cleanText(
      rawData?.marketAnalysis,
      language === 'fr'
        ? 'Analyse générée avec normalisation automatique des données.'
        : 'Analysis generated with automatic data normalization.'
    ),
  };
};

// HELPER: Compute SHA-256 Hash of a File (Robust Content Check)
const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// HELPER: Generate a robust, short, collision-resistant cache key
const generateRobustCacheKey = async (
  title: string,
  needs: string,
  manualSpecs: string,
  reqFiles: File[],
  offFiles: File[],
  rates: any,
  currency: string,
  language: string,
  priorityHint?: ProcurementPriority
): Promise<string> => {
  
  // 1. Compute hashes for all files (ensure order doesn't matter by sorting)
  const reqHashes = await Promise.all(reqFiles.map(computeFileHash));
  const offHashes = await Promise.all(offFiles.map(computeFileHash));
  
  // 2. Create a stable object representing the analysis context
  const payload = JSON.stringify({
    title,
    needs,
    specs: manualSpecs,
    req: reqHashes.sort().join('|'),
    off: offHashes.sort().join('|'),
    rates,
    curr: currency,
    lang: language,
    priority: priorityHint || 'price'
  });

  // 3. Hash the entire payload to get a short, unique key
  const msgBuffer = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// OPTIMIZATION: Client-side Image Compression
// Reduces a 5MB image to ~200KB before sending to API.
// Drastically improves latency for upload and model processing time.
const compressAndEncodeFile = async (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve) => {
    // 1. Handle PDFs directly (No easy compression in browser without heavy libs)
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Strip data:application/pdf;base64, prefix
        resolve({ 
            data: res.split(',')[1], 
            mimeType: 'application/pdf' 
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. Handle Images (Resize & Compress)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Target: Max 1536px width/height (Optimal for OCR vs Size)
        const MAX_DIMENSION = 1536; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Draw resized image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.6 quality (High compression, sufficient for text)
            // Always convert to jpeg for consistency and size, unless it was a png with transparency (rare for scans)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
            resolve({ 
                data: dataUrl.split(',')[1], 
                mimeType: 'image/jpeg' 
            });
        } else {
             // Fallback if canvas fails
             resolve({ 
                 data: (event.target?.result as string).split(',')[1], 
                 mimeType: file.type 
             });
        }
      };
      img.onerror = () => {
          // Fallback if image load fails
          resolve({ 
              data: (event.target?.result as string).split(',')[1], 
              mimeType: file.type 
          });
      };
    };
  });
};

const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } } | null> => {
    try {
        const { data, mimeType } = await compressAndEncodeFile(file);
        return {
            inlineData: {
                data: data,
                mimeType: mimeType,
            },
        };
    } catch (e) {
        console.error("Error preparing file:", file.name, e);
        return null;
    }
};

// Helper: Wait function for backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Exponential Backoff Retry Wrapper with Detailed Logging
async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  initialDelay = 1000,
  operationName = "API Call"
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      const startTime = Date.now();
      if (i > 0) console.log(`[${operationName}] Tentative de reprise ${i + 1}/${retries}...`);
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      if (i > 0) console.log(`[${operationName}] Succès à la tentative ${i + 1} (${duration}ms)`);
      
      return result;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = i === retries - 1;
      
      console.group(`[${operationName}] Erreur lors de la tentative ${i + 1}/${retries}`);
      console.error(`Message: ${error.message || 'Erreur inconnue'}`);
      console.groupEnd();

      if (isLastAttempt) {
         break;
      }

      const nextDelay = initialDelay * Math.pow(2, i);
      await wait(nextDelay);
    }
  }

  throw lastError;
}

// Helper: Clean JSON string
const cleanJsonOutput = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```([a-z]*)\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned;
};

export const analyzeSupplierOffers = async (
  title: string,
  needsDescription: string,
  requestFiles: File[],
  manualSpecs: string,
  offerFiles: File[],
  exchangeRates: { EUR: number, USD: number },
  targetCurrency: string = 'XOF',
  language: 'fr' | 'en' = 'fr',
  priorityHint?: ProcurementPriority,
  onStatusUpdate?: (stage: AnalysisStage) => void
): Promise<AnalysisResult> => {
  if (!ai) {
    throw new Error(
      language === 'fr'
        ? "Clé API Gemini manquante. Configurez `VITE_GEMINI_API_KEY` dans `.env.local`, puis redémarrez l'application."
        : "Missing Gemini API key. Set `VITE_GEMINI_API_KEY` in `.env.local`, then restart the app."
    );
  }

  onStatusUpdate?.('READING_FILES');

  // 1. CHECK CACHE with Robust SHA-256 Key
  const cacheKey = await generateRobustCacheKey(
    title, 
    needsDescription, 
    manualSpecs, 
    requestFiles, 
    offerFiles, 
    exchangeRates, 
    targetCurrency,
    language,
    priorityHint
  );

  if (analysisCache.has(cacheKey)) {
    console.log(`[SmartProcure Cache] Hit! (SHA-256: ${cacheKey.substring(0, 8)}...)`);
    const cachedResult = analysisCache.get(cacheKey)!;
    onStatusUpdate?.('PROCESSING_RESPONSE');
    await wait(300); // Tiny delay for UX
    return {
      ...cachedResult,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
    };
  } else {
    console.log(`[SmartProcure Cache] Miss. Processing new request... (SHA-256: ${cacheKey.substring(0, 8)}...)`);
  }

  // 2. PREPARE FILES (PARALLEL & COMPRESSED)
  const requestPromises = requestFiles.map(file => fileToPart(file));
  const offerPromises = offerFiles.map(file => fileToPart(file));

  const [requestPartsResults, offerPartsResults] = await Promise.all([
    Promise.all(requestPromises),
    Promise.all(offerPromises)
  ]);

  const requestParts = requestPartsResults.filter(p => p !== null) as { inlineData: { data: string; mimeType: string } }[];
  const offerParts = offerPartsResults.filter(p => p !== null) as { inlineData: { data: string; mimeType: string } }[];

  if (offerFiles.length > 0 && offerParts.length === 0) {
     throw new Error("Impossible de lire les fichiers d'offres.");
  }

  const requestPayloadParts = requestParts.flatMap((part, index) => [
    { text: `[BUYER_REQUEST_${index + 1}]` },
    part
  ]);
  const offerPayloadParts = offerParts.flatMap((part, index) => [
    { text: `[SUPPLIER_OFFER_${index + 1}]` },
    part
  ]);

  // 3. SYSTEM INSTRUCTION - UPDATED FOR PURCHASING/FINANCE
  const systemInstruction = `
    You are a Senior Procurement and Financial Auditor.
    Objective: extract reliable supplier data and compare offers with strict financial and technical checks.

    RULES:
    1) Return ONLY JSON and strictly follow the schema.
    2) Extract supplier identity: company name, NIF, email, phone, address.
    3) Financial extraction:
       - Distinguish HT (without tax) and TTC (with tax).
       - If only one amount is present, infer the missing one from context (use 18% VAT only when needed).
       - Normalize currency aliases: FCFA/CFA/XOF => XOF.
    4) Technical extraction:
       - Build a concise mainSpecs summary.
       - technicalScore and complianceScore must remain within [0,100].
    5) Recommendation quality:
       - strengths and weaknesses must be concise and specific.
       - bestOption must exactly match one supplierName from offers.
  `;

  // 4. USER PROMPT
  const prompt = `
    [CONTEXT]
    Project: "${title}"
    Needs: "${needsDescription}"
    Specs: "${manualSpecs}"
    Target Currency: "${targetCurrency}"
    Rates: 1 EUR=${exchangeRates.EUR}, 1 USD=${exchangeRates.USD}
    Priority Hint: "${priorityHint || 'price'}"
    
    [INSTRUCTIONS]
    1. Compare each supplier offer against buyer needs.
    2. Extract normalized supplier details and financial values.
    3. Provide consistent scoring and justified recommendations.
    4. Write marketAnalysis, strengths and weaknesses in ${language === 'fr' ? 'FRENCH' : 'ENGLISH'}.

    Generate JSON conforming to the schema.
  `;

  try {
    const generateContent = async () => {
      onStatusUpdate?.('SENDING_REQUEST');
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Optimized model
        contents: {
          parts: [
            ...requestPayloadParts,
            ...offerPayloadParts,
            { text: prompt }
          ]
        },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysisTitle: { type: Type.STRING },
              needsSummary: { type: Type.STRING },
              marketAnalysis: { type: Type.STRING },
              bestOption: { type: Type.STRING },
              offers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    supplierName: { type: Type.STRING },
                    nif: { type: Type.STRING }, // ADDED NIF
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    address: { type: Type.STRING },
                    totalPriceHT: { type: Type.NUMBER },
                    totalPriceTTC: { type: Type.NUMBER },
                    currency: { type: Type.STRING },
                    originalTotalPriceHT: { type: Type.NUMBER },
                    originalTotalPriceTTC: { type: Type.NUMBER },
                    originalCurrency: { type: Type.STRING },
                    warrantyMonths: { type: Type.INTEGER },
                    deliveryDays: { type: Type.INTEGER },
                    mainSpecs: { type: Type.STRING },
                    technicalScore: { type: Type.NUMBER },
                    complianceScore: { type: Type.NUMBER },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendation: { type: Type.STRING },
                  },
                  required: ["supplierName", "totalPriceHT", "totalPriceTTC", "currency", "technicalScore", "complianceScore"]
                }
              }
            },
            required: ["offers", "bestOption", "marketAnalysis"]
          }
        }
      });
    };

    const response = await retryOperation(generateContent, 3, 1000, "Gemini Analysis");

    if (!response.text) throw new Error("Réponse vide de l'IA.");

    onStatusUpdate?.('PROCESSING_RESPONSE');

    let data;
    try {
      data = JSON.parse(cleanJsonOutput(response.text));
    } catch (parseError) {
      throw new Error("Erreur de format JSON.");
    }
    const normalized = normalizeResult(
      data,
      title,
      needsDescription,
      targetCurrency,
      language,
      priorityHint
    );

    if (normalized.offers.length === 0) {
      throw new Error(language === 'fr'
        ? "Aucune offre exploitable n'a été détectée. Vérifiez les documents fournis."
        : "No usable offer was detected. Please verify the uploaded documents.");
    }

    const finalResult: AnalysisResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US'),
      ...normalized
    };

    analysisCache.set(cacheKey, finalResult);
    if (analysisCache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) {
        analysisCache.delete(oldestKey);
      }
    }
    return finalResult;

  } catch (err: any) {
    console.error("Analysis Error:", err);
    const rawMessage = String(err?.message || '');

    if (/API_KEY_INVALID|API key not valid|invalid api key/i.test(rawMessage)) {
      throw new Error(
        language === 'fr'
          ? "Cle API Gemini invalide. Generez une nouvelle cle dans Google AI Studio, activez le service Generative Language API, puis mettez-la dans `VITE_GEMINI_API_KEY`."
          : "Invalid Gemini API key. Create a new key in Google AI Studio, enable Generative Language API, then set `VITE_GEMINI_API_KEY`."
      );
    }

    if (/PERMISSION_DENIED|SERVICE_DISABLED|API_KEY_SERVICE_BLOCKED|referer|referrer/i.test(rawMessage)) {
      throw new Error(
        language === 'fr'
          ? "La cle API est restreinte ou le service Gemini n'est pas actif pour ce projet. Verifiez les restrictions de cle et activez Generative Language API."
          : "The API key is restricted or Gemini service is not enabled for this project. Check key restrictions and enable Generative Language API."
      );
    }

    throw new Error(
      err.message ||
      (language === 'fr'
        ? "Erreur technique lors de l'analyse."
        : "Technical error while running analysis.")
    );
  }
};
