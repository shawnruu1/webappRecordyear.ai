import JSZip from "jszip";

// Extracts raw text from a PPTX file by unzipping and parsing slide XML.
// PPTX is a ZIP archive; slide text lives in ppt/slides/slide*.xml as <a:t> elements.

export interface PptxExtraction {
  text: string;       // all slide text joined, labeled by slide number
  slideCount: number;
}

export async function extractPptxText(buffer: Buffer): Promise<PptxExtraction> {
  const zip = await JSZip.loadAsync(buffer);

  // Collect slide files in order: ppt/slides/slide1.xml, slide2.xml, ...
  const slideEntries = Object.entries(zip.files)
    .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(([a], [b]) => {
      const numA = parseInt(a.match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
      const numB = parseInt(b.match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
      return numA - numB;
    });

  const slideTexts: string[] = [];

  for (const [, file] of slideEntries) {
    const xml = await file.async("text");

    // <a:t> elements contain the actual text runs in DrawingML
    const runs: string[] = [];
    const pattern = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(xml)) !== null) {
      const decoded = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .trim();
      if (decoded) runs.push(decoded);
    }

    if (runs.length > 0) {
      slideTexts.push(runs.join(" "));
    }
  }

  return {
    text: slideTexts
      .map((t, i) => `[Slide ${i + 1}] ${t}`)
      .join("\n"),
    slideCount: slideEntries.length,
  };
}
