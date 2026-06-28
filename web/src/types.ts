export interface Template {
  slug: string;
  name: string;
  tagline: string;
  mood: string[];
  occasion: string[];
  tone: string[];
  formality: string;
  density: string;
  scheme: string; // "dark" | "light"
  best_for: string;
  avoid_for: string;
  slide_count: number;
}

export interface TemplatesData {
  source: string;
  fetched_count: number;
  templates: Template[];
}
