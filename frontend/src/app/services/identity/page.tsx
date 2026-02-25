import { useLanguage } from "@/contexts/LanguageContext";
import IdentityHero from "@/components/services/identity/IdentityHero";
import ModuleGrid from "@/components/services/identity/ModuleGrid";
import BackButton from "@/components/layout/BackButton";

export default function IdentityPage() {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <div className="absolute top-20 left-6 z-10 hidden md:block">
                <BackButton label="Services" />
            </div>
            <IdentityHero />

            <div className="flex-grow p-6 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">{t("services.identity.title")}</h2>
                        <p className="text-muted-foreground">{t("services.identity.subtitle")}</p>
                    </div>

                    <ModuleGrid />

                    {/* Additional Resources Section */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">{t("services.identity.professional_title")}</h3>
                            <p className="text-sm text-blue-700/80 mb-4">
                                {t("services.identity.professional_desc")}
                            </p>
                            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                                {t("services.identity.professional_cta")} &rarr;
                            </button>
                        </div>
                        <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <h3 className="text-lg font-bold text-amber-900 mb-2">{t("services.identity.lost_identity_title")}</h3>
                            <p className="text-sm text-amber-700/80 mb-4">
                                {t("services.identity.lost_identity_desc")}
                            </p>
                            <button className="text-sm font-semibold text-amber-600 hover:text-amber-800 hover:underline">
                                {t("services.identity.lost_identity_cta")} &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
