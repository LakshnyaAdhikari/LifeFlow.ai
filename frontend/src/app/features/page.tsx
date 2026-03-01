import FooterContentPage from "@/components/layout/FooterContentPage";

export default function FeaturesPage() {
  return (
    <FooterContentPage
      eyebrow="Product"
      title="Platform Features"
      subtitle="The key capabilities that help users move from confusion to clear action."
      sections={[
        {
          title: "Situation Understanding",
          paragraphs: [
            "LifeFlow converts plain-language user input into structured, actionable guidance.",
            "The flow is built to ask follow-up questions where needed so advice remains context-aware.",
          ],
        },
        {
          title: "Guided Action Plans",
          paragraphs: [
            "Users receive step-by-step recommendations, including what to prepare and what to do next.",
            "Priority and urgency cues help users focus on high-impact tasks first.",
          ],
        },
        {
          title: "Continuity and Tracking",
          paragraphs: [
            "Users can continue previous journeys and review progress without restarting from scratch.",
            "Search history and saved context improve continuity across repeated visits.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
