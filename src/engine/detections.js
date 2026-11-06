import { CATEGORIES } from './signatures.js';

const VERSION_RE = /^[\dvA-Za-z.+-]+$/;

/** Accumulates evidence per technology; confidence grows with each independent signal (capped at 100). */
export function createDetectionStore() {
  const detections = new Map();

  function addEvidence(sig, evidenceType, detail, weight = 50, extractedVersion = null) {
    if (!detections.has(sig.id)) {
      const cat = CATEGORIES[sig.category] || {
        id: sig.category,
        label: sig.category,
        iconKey: 'code',
        description: '',
        order: 99
      };
      detections.set(sig.id, {
        id: sig.id,
        name: sig.name,
        description: sig.description || cat.description || '',
        category: sig.category,
        categoryLabel: cat.label,
        categoryIconKey: cat.iconKey || 'code',
        categoryDescription: cat.description || '',
        categoryOrder: cat.order,
        website: sig.website || null,
        version: null,
        confidence: 0,
        evidence: [],
        implies: sig.implies || []
      });
    }

    const item = detections.get(sig.id);
    if (extractedVersion && !item.version && typeof extractedVersion === 'string' && VERSION_RE.test(extractedVersion)) {
      item.version = extractedVersion.replace(/^v/i, '');
    }

    const exists = item.evidence.some((e) => e.type === evidenceType && e.detail === detail);
    if (!exists) {
      item.evidence.push({ type: evidenceType, detail });
      item.confidence = Math.min(100, item.confidence + weight);
    }
  }

  return { detections, addEvidence };
}
