// =============================================
// Centrale datalaag: laadt supermarktdata + init engine
// =============================================

import { loadJSONOncePerDay } from "./cache.js";
import { normalizeAll } from "./matching.js";
import { initEngine } from "./cpi.js";

let loadedData = null;
let engineInitialized = false;

// NEW: promises om dubbele loads in 1 sessie te voorkomen
let loadPromise = null;
let enginePromise = null;

/**
 * Haalt alle supermarktdata (AH, Jumbo, Dirk, Aldi, Hoogvliet) op en normaliseert deze.
 * - Gebruikt IndexedDB via loadJSONOncePerDay (TTL: 1 dag).
 * - Dedupliceert parallelle aanroepen binnen de sessie met loadPromise.
 */
export async function ensureDataLoaded() {
  if (loadedData) return loadedData;
  if (loadPromise) return loadPromise;

  console.log("[DATA] Laden supermarktdata...");

  loadPromise = (async () => {
    const [ahRaw, dirkRaw, jumboRaw, aldiRaw, hoogvlietRaw] = await Promise.all(
      [
        loadJSONOncePerDay("ah", "./dev/store_database/ah.json"),
        loadJSONOncePerDay("dirk", "./dev/store_database/dirk.json"),
        loadJSONOncePerDay("jumbo", "./dev/store_database/jumbo.json"),
        loadJSONOncePerDay("aldi", "./dev/store_database/aldi.json"),
        loadJSONOncePerDay("hoogvliet", "./dev/store_database/hoogvliet.json"),
      ]
    );

    const allProducts = normalizeAll({
      ah: ahRaw,
      dirk: dirkRaw,
      jumbo: jumboRaw,
      aldi: aldiRaw,
      hoogvliet: hoogvlietRaw,
    });

    loadedData = {
      ahRaw,
      dirkRaw,
      jumboRaw,
      aldiRaw,
      hoogvlietRaw,
      allProducts,
    };
    console.log(`[DATA] ${allProducts.length} producten geladen`);
    return loadedData;
  })();

  try {
    const data = await loadPromise;
    return data;
  } finally {
    // laat loadPromise bestaan zodat latere calls meteen resolved promise terugkrijgen
    // (niet resetten) – dit voorkomt thrash bij snelle route-wissels
  }
}

/**
 * Initialiseert de CPI-engine, slechts één keer per sessie.
 * Dedupliceert parallel via enginePromise.
 */
export async function ensureEngineReady() {
  if (engineInitialized) return;
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const { ahRaw, dirkRaw, jumboRaw, aldiRaw, hoogvlietRaw } =
      await ensureDataLoaded();
    await initEngine({
      ah: ahRaw,
      dirk: dirkRaw,
      jumbo: jumboRaw,
      aldi: aldiRaw,
      hoogvliet: hoogvlietRaw,
    });
    engineInitialized = true;
    console.log("[CPI] Engine geïnitialiseerd");
  })();

  return enginePromise;
}

/**
 * Haalt direct alle producten op die al zijn geladen.
 * Handig voor componenten die geen async willen gebruiken.
 */
export function getAllProductsSync() {
  return loadedData?.allProducts || [];
}

/**
 * NEW: Warm-start helper – start data + engine preload na login.
 * Call deze 1x na succesvolle login (of bij app boot als user al ingelogd is).
 */
export async function warmupDataAndEngine() {
  // Start beide processen “in de achtergrond” (promise blijft gedeeld)
  // Niet awaiten als je UI meteen wil renderen; wél awaiten als je spinner/ready-state gebruikt.
  const p1 = ensureDataLoaded();
  const p2 = ensureEngineReady();
  // Optioneel: return één promise voor callers die willen wachten
  return Promise.all([p1, p2]);
}
