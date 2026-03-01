import FooterContentPage from "@/components/layout/FooterContentPage";

export default function KnowledgeHubPage() {
  return (
    <FooterContentPage
      eyebrow="Resources"
      title="Knowledge Hub"
      subtitle="A structured place to learn how LifeFlow approaches legal and administrative problem-solving."
      sections={[
        {
          title: "What You Will Find",
          paragraphs: [
            "Plain-language explainers for common legal and procedural situations.",
            "Practical breakdowns of documentation requirements, timelines, and common mistakes.",
          ],
        },
        {
          title: "How To Use This Hub",
          paragraphs: [
            "Start with your issue category, then follow the recommended checklists before taking action.",
            "Use the FAQ and guides together for both quick answers and deeper context.",
          ],
        },
        {
          title: "Source Reliability",
          paragraphs: [
            "We prioritize official sources and process documentation where possible.",
            "This hub is informational and does not replace professional legal advice for complex cases.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
