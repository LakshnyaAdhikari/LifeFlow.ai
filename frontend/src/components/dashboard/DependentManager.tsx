"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCircle, Trash2, Heart, Shield } from "lucide-react";

interface Dependent {
    id: number;
    name: string;
    relation: string;
    age?: number;
    domain_specific_notes?: string;
}

export default function DependentManager() {
    const [dependents, setDependents] = useState<Dependent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDependent, setNewDependent] = useState({
        name: "",
        relation: "Child",
        age: "",
        domain_specific_notes: ""
    });

    useEffect(() => {
        fetchDependents();
    }, []);

    const fetchDependents = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://127.0.0.1:8000/dashboard/dependents", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDependents(data);
            }
        } catch (e) {
            console.error("Failed to fetch dependents:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://127.0.0.1:8000/dashboard/dependents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newDependent,
                    age: newDependent.age ? parseInt(newDependent.age) : null
                })
            });
            if (res.ok) {
                setShowAddForm(false);
                setNewDependent({ name: "", relation: "Child", age: "", domain_specific_notes: "" });
                fetchDependents();
            }
        } catch (e) {
            console.error("Failed to add dependent:", e);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Dependents & Linked Profiles</h2>
                    <p className="text-muted-foreground">Manage your family members and link them to relevant legal situations.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Dependent
                </button>
            </div>

            {showAddForm && (
                <div className="p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-xl animate-in zoom-in-95 duration-300">
                    <form onSubmit={handleAdd} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Full Name</label>
                                <input
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 ring-primary/20"
                                    placeholder="Enter full name"
                                    required
                                    value={newDependent.name}
                                    onChange={e => setNewDependent({ ...newDependent, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Relation</label>
                                <select
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 ring-primary/20"
                                    value={newDependent.relation}
                                    onChange={e => setNewDependent({ ...newDependent, relation: e.target.value })}
                                >
                                    <option>Parent</option>
                                    <option>Child</option>
                                    <option>Spouse</option>
                                    <option>Guardian</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Age (Optional)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 ring-primary/20"
                                    placeholder="Enter age"
                                    value={newDependent.age}
                                    onChange={e => setNewDependent({ ...newDependent, age: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Domain-Specific Notes (Optional)</label>
                            <textarea
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 ring-primary/20 h-24"
                                placeholder="E.g., Medical history for insurance, Aadhaar linked status, etc."
                                value={newDependent.domain_specific_notes}
                                onChange={e => setNewDependent({ ...newDependent, domain_specific_notes: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
                                Save Dependent
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-8 py-3 bg-muted text-muted-foreground rounded-xl font-bold hover:bg-muted/80 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dependents.map((dep, idx) => (
                    <div key={`dependent-${dep.id}-${idx}`} className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                                <UserCircle className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <Heart className="w-3 h-3 text-red-500" />
                                {dep.relation}
                            </div>
                        </div>
                        <h4 className="text-xl font-bold mb-1">{dep.name}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{dep.age ? `${dep.age} years old` : "Age not specified"}</p>

                        {dep.domain_specific_notes && (
                            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground italic leading-relaxed">
                                "{dep.domain_specific_notes}"
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Shield className="w-3 h-3" />
                                View Situations
                            </button>
                            <button className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {dependents.length === 0 && !loading && (
                    <div className="col-span-full py-20 bg-muted/30 border-2 border-dashed border-border rounded-3xl text-center">
                        <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No dependents added yet</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                            LifeFlow is family-centric. Add your dependents to manage their legal journey alongside yours.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
