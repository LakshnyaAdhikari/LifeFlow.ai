import FooterContentPage from "@/components/layout/FooterContentPage";

export default function HowItWorksPage() {
  return (
    <FooterContentPage
      eyebrow="Product"
      title="How LifeFlow Works"
      subtitle="A simple three-step model designed to convert complex legal and administrative confusion into clear next actions."
      sections={[
        {
          title: "Step 1: Describe Your Situation",
          paragraphs: [
            "Users explain their issue in plain language without legal jargon.",
            "The platform captures context needed to identify relevant procedures and likely constraints.",
          ],
        },
        {
          title: "Step 2: Context Analysis",
          paragraphs: [
            "LifeFlow analyzes intent, domain, and user context to classify the issue accurately.",
            "When needed, the flow asks clarification questions to improve quality before generating guidance.",
          ],
        },
        {
          title: "Step 3: Guided Next Actions",
          paragraphs: [
            "The platform returns a structured action plan with practical steps and follow-up direction.",
            "Users can continue their journey, track status, and refine outcomes over time.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
