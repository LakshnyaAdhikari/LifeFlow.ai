import FooterContentPage from "@/components/layout/FooterContentPage";

export default function ReportIssuePage() {
  return (
    <FooterContentPage
      eyebrow="Support"
      title="Report Issue"
      subtitle="Found a bug or broken flow? Report it with enough detail so we can reproduce and fix it quickly."
      sections={[
        {
          title: "What To Include",
          paragraphs: [
            "Describe what you expected, what happened instead, and the exact page where the issue occurred.",
            "If possible, include steps to reproduce and screenshots.",
          ],
        },
        {
          title: "Urgent Problems",
          paragraphs: [
            "For login blockers, broken core flows, or data-related concerns, mention Urgent in your subject.",
            "Send urgent reports to: support@lifeflow.ai",
          ],
        },
        {
          title: "Security Reporting",
          paragraphs: [
            "If you discover a potential security issue, do not disclose it publicly.",
            "Please share details privately at: legal@lifeflow.ai",
          ],
        },
      ]}
      updatedOn="March 1, 2026"
    />
  );
}
