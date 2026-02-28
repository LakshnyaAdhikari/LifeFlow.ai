"use client";

import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function Documents() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const documentTypes = [
        { value: "aadhar", label: "Aadhar Card" },
        { value: "pan", label: "PAN Certificate" },
        { value: "passport", label: "Passport" },
        { value: "license", label: "Driving License" },
        { value: "property", label: "Property Deed" },
        { value: "insurance", label: "Insurance Documents" },
        { value: "other", label: "Other Documents" },
    ];

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
        setLoading(false);
    }, []);

    const handleDelete = (id: number) => {
        setDocuments(documents.filter(doc => doc.id !== id));
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // TODO: Handle file upload to API
        const files = e.target.files;
        if (files) {
            console.log("Upload file:", files[0]);
            // Implement API call to upload file
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Documents</h1>
                <p className="text-muted-foreground">Upload and manage your important documents</p>
            </div>

            {/* Upload Section */}
            <label className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 rounded-2xl text-center hover:border-primary/50 transition-colors group cursor-pointer">
                <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors w-fit mx-auto">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground mb-1">Upload Document</h3>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleUpload}
                    />
                </div>
            </label>

            {/* Document Type Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {documentTypes.map((type) => (
                    <div key={type.value} className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="font-medium text-foreground">{type.label}</p>
                    </div>
                ))}
            </div>

            {/* Uploaded Documents */}
            <div>
                <h3 className="font-bold text-lg mb-4">Uploaded Documents</h3>
                {loading ? (
                    <div className="py-12 text-center">
                        <div className="inline-block animate-spin">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mt-4">Loading...</p>
                    </div>
                ) : documents.length > 0 ? (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{doc.name}</h4>
                                        <p className="text-xs text-muted-foreground">{doc.uploadDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No documents uploaded</h3>
                        <p className="text-sm text-muted-foreground">Upload your documents to keep them organized</p>
                    </div>
                )}
            </div>
        </div>
    );
}
