import FooterContentPage from "@/components/layout/FooterContentPage";

export default function FaqPage() {
  return (
    <FooterContentPage
      eyebrow="Support"
      title="Frequently Asked Questions"
      subtitle="Quick answers to common questions about using LifeFlow.ai safely and effectively."
      sections={[
        {
          title: "Is LifeFlow legal advice?",
          paragraphs: [
            "No. LifeFlow provides informational guidance and structured next steps, not legal representation.",
            "You should consult a qualified legal professional for case-specific legal advice.",
          ],
        },
        {
          title: "How fast can I get guidance?",
          paragraphs: [
            "Most users receive an initial action plan within minutes after sharing their situation.",
            "Complex cases may require additional clarification questions for better accuracy.",
          ],
        },
        {
          title: "How can I report an issue or share feedback?",
          paragraphs: [
            "Use the Feedback Form for product suggestions and usability comments.",
            "Use Report Issue for bugs, broken links, and urgent product errors.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
