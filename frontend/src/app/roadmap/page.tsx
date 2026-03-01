import FooterContentPage from "@/components/layout/FooterContentPage";

export default function RoadmapPage() {
  return (
    <FooterContentPage
      eyebrow="Product"
      title="LifeFlow Roadmap"
      subtitle="What we are building next to make legal and administrative guidance faster, safer, and easier to use."
      sections={[
        {
          title: "Now",
          paragraphs: [
            "Improving guidance quality with stronger context understanding and cleaner step-by-step outputs.",
            "Expanding identity and document-related coverage with better issue-specific checklists.",
          ],
        },
        {
          title: "Next",
          paragraphs: [
            "Personalized follow-up timelines so users can track deadlines and required actions.",
            "Better multilingual support to make guidance easier for users across different language preferences.",
          ],
        },
        {
          title: "Later",
          paragraphs: [
            "Deeper integrations for document workflows and guided submission paths.",
            "Improved reliability scoring and clearer source references for every recommendation.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
