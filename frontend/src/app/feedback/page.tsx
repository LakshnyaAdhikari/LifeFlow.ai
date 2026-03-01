import FooterContentPage from "@/components/layout/FooterContentPage";

export default function FeedbackPage() {
  return (
    <FooterContentPage
      eyebrow="Support"
      title="Feedback Form"
      subtitle="We use feedback to improve clarity, speed, and trust in every part of the user journey."
      sections={[
        {
          title: "What To Share",
          paragraphs: [
            "Tell us what worked, what felt confusing, and which workflows should be improved.",
            "Include your goal and where you got stuck so we can prioritize fixes accurately.",
          ],
        },
        {
          title: "Where To Send Feedback",
          paragraphs: [
            "Email: hello@lifeflow.ai",
            "For product suggestions, include the subject line: Product Feedback.",
          ],
        },
        {
          title: "Response Expectations",
          paragraphs: [
            "We review all submissions and use recurring themes to shape roadmap priorities.",
            "Critical product issues should be sent through the Report Issue page.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
