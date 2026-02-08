"use client";

import { FileText, Plus, MoreVertical, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function MyDocumentsPage() {
    const documents = [
        { id: 1, type: "Aadhaar Card", number: "xxxx-xxxx-1234", status: "Active", lastUpdated: "2024-01-15", expiry: null },
        { id: 2, type: "Passport", number: "Z1234567", status: "Expiring Soon", lastUpdated: "2020-05-10", expiry: "2025-05-10" },
        { id: 3, type: "PAN Card", number: "ABCDE1234F", status: "Active", lastUpdated: "2023-11-20", expiry: null },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <div className="p-6 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">My Documents</h1>
                            <p className="text-muted-foreground">Track and manage your official identity documents.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                            <Plus className="w-4 h-4" /> Add Document
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/5 rounded-lg text-primary">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{doc.type}</h3>
                                <p className="text-sm text-muted-foreground font-mono mb-4">{doc.number}</p>

                                <div className="flex items-center justify-between mt-4 text-xs font-medium">
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${doc.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            doc.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {doc.status === 'Active' && <CheckCircle className="w-3 h-3" />}
                                        {doc.status === 'Expiring Soon' && <Clock className="w-3 h-3" />}
                                        {doc.status}
                                    </span>
                                    {doc.expiry && (
                                        <span className="text-muted-foreground">Exp: {doc.expiry}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add New Placeholder */}
                        <button className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all h-full min-h-[200px]">
                            <Plus className="w-8 h-8 mb-2 opacity-50" />
                            <span className="font-medium">Add another document</span>
                        </button>
                    </div>

                    {/* Alerts Section */}
                    <div className="mt-12">
                        <h2 className="text-lg font-bold mb-4">Action Required</h2>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Passport Expiring Soon</h4>
                                <p className="text-xs text-amber-800 mt-1">
                                    Your passport (Z1234567) expires in less than 6 months. International travel may be restricted.
                                </p>
                                <button className="mt-2 text-xs font-bold text-amber-700 underline">Start Renewal Process</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
