"use client";

import { Heart, Star } from "lucide-react";
import { useState, useEffect } from "react";

export default function StarredChats() {
    const [starredChats, setStarredChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch starred chats from API
        // const fetchStarredChats = async () => {
        //     try {
        //         const token = localStorage.getItem("access_token");
        //         const res = await fetch("http://127.0.0.1:8000/api/starred-chats", {
        //             headers: { "Authorization": `Bearer ${token}` }
        //         });
        //         const data = await res.json();
        //         setStarredChats(data);
        //     } catch (error) {
        //         console.error("Failed to fetch starred chats:", error);
        //     } finally {
        //         setLoading(false);
        //     }
        // };
        // fetchStarredChats();
        setLoading(false);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Starred Chats</h1>
                <p className="text-muted-foreground">Your favorite conversations and discussions</p>
            </div>

            {loading ? (
                <div className="py-12 text-center">
                    <div className="inline-block animate-spin">
                        <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mt-4">Loading...</p>
                </div>
            ) : starredChats.length > 0 ? (
                <div className="space-y-3">
                    {starredChats.map((chat) => (
                        <div
                            key={chat.id}
                            className="p-5 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950/30 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-950/50 transition-colors">
                                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{chat.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{chat.preview}</p>
                                </div>
                                <div className="text-xs text-muted-foreground flex-shrink-0">{chat.date}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                    <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No starred chats yet</h3>
                    <p className="text-sm text-muted-foreground">Star your favorite conversations to save them here</p>
                </div>
            )}
        </div>
    );
}
