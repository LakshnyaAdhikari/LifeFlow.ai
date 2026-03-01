import FooterContentPage from "@/components/layout/FooterContentPage";

export default function TermsPage() {
  return (
    <FooterContentPage
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The rules and expectations that apply when using LifeFlow.ai services."
      sections={[
        {
          title: "Use of Service",
          paragraphs: [
            "You agree to use LifeFlow.ai lawfully and not misuse, disrupt, or attempt unauthorized access.",
            "You are responsible for ensuring submitted information is accurate and appropriate.",
          ],
        },
        {
          title: "Account Responsibility",
          paragraphs: [
            "You are responsible for maintaining account confidentiality and protecting login credentials.",
            "You must notify us promptly if you suspect unauthorized account activity.",
          ],
        },
        {
          title: "Liability and Updates",
          paragraphs: [
            "Services are provided on an as-available basis, and we may update features over time.",
            "By continuing to use LifeFlow.ai, you accept current terms and associated legal policies.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
