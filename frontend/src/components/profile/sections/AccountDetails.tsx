"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, Users, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountDetails() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.full_name?.split(" ")[0] || "",
        last_name: user?.full_name?.split(" ").slice(1).join(" ") || "",
        email: user?.email || "",
        phone: user?.phone || "",
        age: user?.profile?.age_range || "",
        gender: user?.profile?.gender || "",
        state: user?.profile?.location_state || "",
        city: user?.profile?.location_city || "",
        family_status: user?.profile?.family_status || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const res = await fetch("http://127.0.0.1:8000/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: `${formData.first_name} ${formData.last_name}`,
                    ...formData
                })
            });

            if (res.ok) {
                setIsEditing(false);
                // Optionally refresh user data
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Account Details</h1>
                    <p className="text-muted-foreground">Manage your personal information</p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isEditing
                            ? "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                >
                    {isEditing ? (
                        <>
                            <X className="w-4 h-4" />
                            Cancel
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </>
                    )}
                </button>
            </div>

            {/* Personal Information Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">First Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.first_name}</p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Last Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.last_name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Email
                        </label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.email}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            Phone
                        </label>
                        <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground text-sm text-muted-foreground">
                            {formData.phone || "Not set"}
                        </p>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Gender</label>
                        {isEditing ? (
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground capitalize">{formData.gender || "Not set"}</p>
                        )}
                    </div>

                    {/* Age */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Age Range
                        </label>
                        {isEditing ? (
                            <select
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            >
                                <option value="">Select age range</option>
                                <option value="18-25">18-25</option>
                                <option value="26-40">26-40</option>
                                <option value="41-60">41-60</option>
                                <option value="60+">60+</option>
                            </select>
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.age || "Not set"}</p>
                        )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            State
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="e.g. Maharashtra"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.state || "Not set"}</p>
                        )}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">City</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="e.g. Mumbai"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.city || "Not set"}</p>
                        )}
                    </div>

                    {/* Family Status */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Family Status
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="family_status"
                                value={formData.family_status}
                                onChange={handleChange}
                                placeholder="e.g. Head of family, living with parents"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        ) : (
                            <p className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{formData.family_status || "Not set"}</p>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
