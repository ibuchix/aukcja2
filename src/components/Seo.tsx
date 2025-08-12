import { useEffect } from "react";

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, any>;
}

export const Seo = ({ title, description, canonicalPath, jsonLd }: SeoProps) => {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    if (description) {
      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement("meta");
        desc.setAttribute("name", "description");
        document.head.appendChild(desc);
      }
      desc.setAttribute("content", description);
    }

    // Canonical
    if (canonicalPath) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      const origin = window.location.origin;
      link.setAttribute("href", `${origin}${canonicalPath}`);
    }

    // Structured data
    const scriptId = "seo-structured-data";
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, jsonLd]);

  return null;
};

export default Seo;
