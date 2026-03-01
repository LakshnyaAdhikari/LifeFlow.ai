import FooterContentPage from "@/components/layout/FooterContentPage";

export default function DisclaimerPage() {
  return (
    <FooterContentPage
      eyebrow="Legal"
      title="Disclaimer"
      subtitle="Important limits and boundaries on how information from LifeFlow.ai should be used."
      sections={[
        {
          title: "Informational Use Only",
          paragraphs: [
            "LifeFlow.ai provides educational and procedural guidance, not legal advice or legal representation.",
            "Outputs may not account for every fact, jurisdictional variation, or recent procedural change.",
          ],
        },
        {
          title: "No Outcome Guarantee",
          paragraphs: [
            "Using this platform does not guarantee approval, success, or a specific legal outcome.",
            "Users remain responsible for decisions and actions taken after reviewing platform guidance.",
          ],
        },
        {
          title: "Professional Advice",
          paragraphs: [
            "Consult a qualified professional for serious legal exposure, deadlines, or financial risk.",
            "If guidance conflicts with official notices or orders, follow competent legal counsel.",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
