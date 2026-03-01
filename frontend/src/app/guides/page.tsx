import FooterContentPage from "@/components/layout/FooterContentPage";

export default function LegalGuidesPage() {
  return (
    <FooterContentPage
      eyebrow="Resources"
      title="Legal Guides"
      subtitle="Concise guides focused on common procedural journeys so users can act with confidence."
      sections={[
        {
          title: "Guide Format",
          paragraphs: [
            "Each guide includes who it applies to, required documents, action steps, and expected timelines.",
            "Where relevant, we include escalation paths if the first attempt fails.",
          ],
        },
        {
          title: "Popular Topics",
          paragraphs: [
            "Identity document corrections and reissuance.",
            "Basic grievance workflows for service delays, rejection, or documentation mismatch.",
          ],
        },
        {
          title: "Important Note",
          paragraphs: [
            "Guides are educational in nature and may not cover rare case-specific exceptions.",
            "For high-stakes or urgent legal consequences, consult a licensed legal professional.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
