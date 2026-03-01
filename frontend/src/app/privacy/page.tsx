import FooterContentPage from "@/components/layout/FooterContentPage";

export default function PrivacyPolicyPage() {
  return (
    <FooterContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How LifeFlow.ai collects, uses, and protects information shared while using the platform."
      sections={[
        {
          title: "Data We Collect",
          paragraphs: [
            "We collect account details and user-submitted situation context needed to provide guidance features.",
            "We may collect technical diagnostics needed to maintain performance, reliability, and security.",
          ],
        },
        {
          title: "How Data Is Used",
          paragraphs: [
            "Data is used to generate guidance, improve feature quality, and maintain system integrity.",
            "We do not sell personal data to third parties.",
          ],
        },
        {
          title: "Your Controls",
          paragraphs: [
            "You can request correction or deletion of your account data by contacting legal@lifeflow.ai.",
            "By continuing to use LifeFlow.ai, you agree to this policy and related legal terms.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
