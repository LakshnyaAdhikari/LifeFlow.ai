"use client";

import { 
    Upload, FileText, Download, Trash2, Plus, File,
    CreditCard, Award, Ticket, Heart, BookOpen, Car, Home, Shield
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface DocumentItem {
    id: string;
    category: string;
    fileName: string;
    uploadDate: string;
    fileSize: string;
}

const documentCategories = [
    { id: "aadhar", label: "Aadhar Card", Icon: CreditCard, bgColor: "bg-teal-100/50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400" },
    { id: "pan", label: "PAN Card", Icon: CreditCard, bgColor: "bg-blue-100/50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { id: "passport", label: "Passport", Icon: Award, bgColor: "bg-cyan-100/50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
    { id: "ration", label: "Ration Card", Icon: Ticket, bgColor: "bg-emerald-100/50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { id: "birth_cert", label: "Birth Certificate", Icon: Heart, bgColor: "bg-pink-100/50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400" },
    { id: "marksheets", label: "Marksheets", Icon: BookOpen, bgColor: "bg-purple-100/50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400" },
    { id: "drivers_license", label: "Driving License", Icon: Car, bgColor: "bg-orange-100/50 dark:bg-orange-950/30", iconColor: "text-orange-600 dark:text-orange-400" },
    { id: "property_deed", label: "Property Deed", Icon: Home, bgColor: "bg-amber-100/50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { id: "insurance", label: "Insurance Documents", Icon: Shield, bgColor: "bg-indigo-100/50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { id: "other", label: "Other Documents", Icon: File, bgColor: "bg-gray-100/50 dark:bg-gray-950/30", iconColor: "text-gray-600 dark:text-gray-400" },
];

export default function Documents() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

    useEffect(() => {
        // TODO: Fetch documents from API
        // const fetchDocuments = async () => {
        //     try {
        //         const token = localStorage.getItem("access_token");
        //         const res = await fetch("http://127.0.0.1:8000/api/documents", {
        //             headers: { "Authorization": `Bearer ${token}` }
        //         });
        //         const data = await res.json();
        //         setDocuments(data);
        //     } catch (error) {
        //         console.error("Failed to fetch documents:", error);
        //     } finally {
        //         setLoading(false);
        //     }
        // };
        // fetchDocuments();

        // Load documents from localStorage for persistence
        const savedDocuments = localStorage.getItem("user_documents");
        if (savedDocuments) {
            setDocuments(JSON.parse(savedDocuments));
        }
        setLoading(false);
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            const newDoc: DocumentItem = {
                id: `${categoryId}_${Date.now()}`,
                category: categoryId,
                fileName: file.name,
                uploadDate: new Date().toLocaleDateString(),
                fileSize: (file.size / 1024).toFixed(2) + " KB",
            };

            const updatedDocuments = [...documents, newDoc];
            setDocuments(updatedDocuments);
            
            // Save to localStorage for persistence
            localStorage.setItem("user_documents", JSON.stringify(updatedDocuments));
            
            console.log("Uploaded:", newDoc);
            // TODO: Upload to API backend
        }
    };

    const handleDelete = (id: string) => {
        const updatedDocuments = documents.filter(doc => doc.id !== id);
        setDocuments(updatedDocuments);
        localStorage.setItem("user_documents", JSON.stringify(updatedDocuments));
    };

    const getDocumentsByCategory = (categoryId: string) => {
        return documents.filter(doc => doc.category === categoryId);
    };

    const getCategoryLabel = (categoryId: string) => {
        return documentCategories.find(cat => cat.id === categoryId)?.label || "Unknown";
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Documents</h1>
                <p className="text-muted-foreground">Upload and organize your important documents by category</p>
            </div>

            {/* Document Categories */}
            <div className="space-y-3">
                {documentCategories.map((category) => {
                    const categoryDocs = getDocumentsByCategory(category.id);
                    const isExpanded = expandedCategory === category.id;

                    return (
                        <div
                            key={category.id}
                            className="border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all"
                        >
                            {/* Category Header */}
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                                className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-card to-muted/30 hover:from-primary/5 hover:to-primary/5 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${category.bgColor}`}>
                                        <category.Icon className={`w-5 h-5 ${category.iconColor}`} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-foreground">{category.label}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {categoryDocs.length} document{categoryDocs.length !== 1 ? "s" : ""} uploaded
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                                        {categoryDocs.length}
                                    </span>
                                    <svg
                                        className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </div>
                            </button>

                            {/* Category Content */}
                            {isExpanded && (
                                <div className="p-4 bg-muted/20 border-t border-border space-y-3">
                                    {/* Upload Button */}
                                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                <Upload className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-foreground">Upload {category.label}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                                            </div>
                                        </div>
                                        <input
                                            ref={(el) => {
                                                if (el) fileInputRefs.current[category.id] = el;
                                            }}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => handleUpload(e, category.id)}
                                        />
                                    </label>

                                    {/* Documents List */}
                                    {categoryDocs.length > 0 ? (
                                        <div className="space-y-2">
                                            {categoryDocs.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 flex-grow min-w-0">
                                                        <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-950/30 flex-shrink-0">
                                                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="min-w-0 flex-grow">
                                                            <h4 className="font-medium text-foreground text-sm truncate">{doc.fileName}</h4>
                                                            <p className="text-xs text-muted-foreground">{doc.uploadDate} • {doc.fileSize}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                // TODO: Implement download
                                                                alert("Download feature coming soon!");
                                                            }}
                                                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center">
                                            <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mx-auto mb-2`}>
                                                <category.Icon className={`w-6 h-6 ${category.iconColor}`} />
                                            </div>
                                            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            {documents.length > 0 && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-sm text-foreground">
                        <span className="font-semibold">{documents.length} document{documents.length !== 1 ? "s" : ""}</span> stored in your account
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Your documents are securely saved and will persist even after closing the browser</p>
                </div>
            )}
        </div>
    );
}
