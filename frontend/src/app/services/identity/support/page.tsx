"use client";

import { LifeBuoy, Mail, Phone } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 lg:p-12">
            <div className="max-w-4xl mx-auto text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LifeBuoy className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Support & Assistance</h1>
                <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
                    Need help navigating the identity services? Our support team is here to assist you.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    <div className="p-8 bg-card border border-border rounded-2xl">
                        <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-2">Email Support</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get a response within 24 hours.</p>
                        <a href="mailto:support@lifeflow.ai" className="text-primary font-bold hover:underline">support@lifeflow.ai</a>
                    </div>

                    <div className="p-8 bg-card border border-border rounded-2xl">
                        <Phone className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-2">Helpline</h3>
                        <p className="text-sm text-muted-foreground mb-4">Mon-Fri, 9am - 6pm</p>
                        <span className="text-lg font-bold text-foreground">1800-123-4567</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
