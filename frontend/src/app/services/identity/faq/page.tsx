"use client";

import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQPage() {
    const faqs = [
        { q: "How long does it take to update Aadhaar address?", a: "Typically 5-15 working days after successful verification." },
        { q: "Can I apply for a Passport without a birth certificate?", a: "Yes, other documents like 10th marksheet or Aadhaar can typically serve as proof of DOB." },
        { q: "Is linking Aadhaar with PAN mandatory?", a: "Yes, it is mandatory for filing IT returns and preventing PAN from becoming inoperative." },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 lg:p-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <HelpCircle className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                            <p className="text-muted-foreground">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
