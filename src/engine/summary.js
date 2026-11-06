/** Plain-English one-line summary and four-layer topology for the report header. */

export function buildArchitectureSummary(technologies, frameworkInternals) {
  const byCat = (cats) =>
    technologies
      .filter(t => cats.includes(t.category))
      .map(t => (t.version ? `${t.name} v${t.version}` : t.name));

  const uiTech = byCat(['SSR_META', 'FRAMEWORK']);
  const cssTech = byCat(['CSS_UI']);
  const cmsTech = byCat(['CMS_ECOMM']);
  const edgeTech = byCat(['CDN_EDGE', 'SERVER']);
  const backendTech = byCat(['BACKEND', 'BAAS_DB', 'STATE_DATA']);
  const serviceTech = byCat(['AUTH', 'PAYMENTS', 'ANALYTICS', 'OBSERVABILITY', 'AI_AGENTS', 'SUPPORT_CRM']);

  const parts = [];
  if (uiTech.length > 0) {
    parts.push(`built with **${uiTech.slice(0, 2).join(' & ')}**`);
  } else if (cmsTech.length > 0) {
    parts.push(`powered by **${cmsTech.slice(0, 2).join(' & ')}**`);
  }

  if (cssTech.length > 0) {
    parts.push(`styled using **${cssTech.slice(0, 2).join(' + ')}**`);
  }

  if (edgeTech.length > 0) {
    parts.push(`delivered via **${edgeTech.slice(0, 2).join(' / ')}**`);
  }

  if (serviceTech.length > 0) {
    parts.push(`integrated with **${serviceTech.slice(0, 3).join(', ')}**`);
  }

  let executiveSummary = 'Standard HTML/CSS web page with minimal external framework footprints.';
  if (parts.length > 0) {
    const joined = parts.join(', ');
    executiveSummary = `This site is ${joined}.`;
  }

  const topologyLayers = [
    {
      id: 'frontend',
      label: 'Interface & Styling',
      items: [...uiTech, ...cssTech].slice(0, 5)
    },
    {
      id: 'data_backend',
      label: 'Backend, CMS & Data',
      items: [...cmsTech, ...backendTech].slice(0, 5)
    },
    {
      id: 'infra',
      label: 'Hosting & Edge',
      items: edgeTech.slice(0, 5)
    },
    {
      id: 'services',
      label: 'Services & Telemetry',
      items: serviceTech.slice(0, 5)
    }
  ].filter(layer => layer.items.length > 0);

  return { executiveSummary, topologyLayers };
}
