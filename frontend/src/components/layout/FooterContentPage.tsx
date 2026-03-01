"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Section = {
  title: string;
  paragraphs: string[];
};

type FooterContentPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: Section[];
  updatedOn: string;
};

export default function FooterContentPage({
  eyebrow,
  title,
  subtitle,
  sections,
  updatedOn,
}: FooterContentPageProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const backHref = from === "home" ? "/home" : "/";
  const backLabel = from === "home" ? "Back to Home" : "Back to Landing";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Link>
          </div>
        </div>

        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">{eyebrow}</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">{title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {sections.map((section) => (
              <article key={section.title} className="bg-card border border-border rounded-2xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={`${section.title}-${index}`} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}

            <div className="text-sm text-muted-foreground border-t border-border pt-6">
              Last updated: {updatedOn}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
