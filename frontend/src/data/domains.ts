
import {
    Shield,
    Gavel,
    Wallet,
    Briefcase,
    Home,
    Users,
    Fingerprint,
    Scale,
    CreditCard,
    FileText,
    Building,
    Heart,
    Car,
    FileSearch,
    AlertCircle,
    Handshake,
    CheckCircle,
    UserCircle,
    ClipboardCheck
} from "lucide-react";

export interface SubDomain {
    id: string;
    title: string;
    icon: any;
    description?: string;
}

export interface Domain {
    id: string;
    name: string;
    icon: any;
    shortDescription: string;
    fullDescription: string;
    subdomains: SubDomain[];
}

export const DOMAINS: Domain[] = [
    {
        id: "identity",
        name: "Identity & Govt Services",
        icon: Shield,
        shortDescription: "Manage Aadhaar, PAN, Passports, and other official IDs.",
        fullDescription: "Get official guidance on Indian identity documents. We help you navigate applications, corrections, and renewals for Aadhaar, PAN, and more.",
        subdomains: [
            { id: "aadhaar", title: "Aadhaar Services", icon: Fingerprint },
            { id: "pan", title: "PAN Card Services", icon: CreditCard },
            { id: "passport", title: "Passport Services", icon: FileText },
            { id: "driving-license", title: "Driving License & Vehicle RC", icon: Car },
            { id: "voter-id", title: "Voter ID & Other Govt IDs", icon: Users }
        ]
    },
    {
        id: "legal",
        name: "Legal & Court Matters",
        icon: Gavel,
        shortDescription: "Civil, criminal, and litigation guidance.",
        fullDescription: "Clear, step-by-step guidance for legal procedures, court filings, and understanding your rights in the Indian judicial system.",
        subdomains: [
            { id: "fir", title: "Filing a Police Complaint (FIR)", icon: AlertCircle },
            { id: "consumer-court", title: "Consumer Court Cases", icon: Handshake },
            { id: "civil-disputes", title: "Civil Disputes (Money/Property)", icon: Scale },
            { id: "criminal-guidance", title: "Criminal Case Guidance", icon: Gavel },
            { id: "court-procedure", title: "Court Procedure & Tracking", icon: FileSearch }
        ]
    },
    {
        id: "financial",
        name: "Financial & Consumer",
        icon: Wallet,
        shortDescription: "Banking, tax, and consumer protection.",
        fullDescription: "Protect your financial interests. We assist with banking disputes, tax compliance, and consumer rights issues.",
        subdomains: [
            { id: "income-tax", title: "Income Tax & ITR Filing", icon: Wallet },
            { id: "banking-disputes", title: "Banking Disputes (Fraud/Chargeback)", icon: Building },
            { id: "insurance-claims", title: "Insurance Claims & Rejections", icon: Heart },
            { id: "loan-emi", title: "Loan & EMI Issues", icon: AlertCircle },
            { id: "consumer-complaint", title: "Consumer Complaint (E-commerce)", icon: ShoppingCart }
        ]
    },
    {
        id: "employment",
        name: "Employment & Labor",
        icon: Briefcase,
        shortDescription: "Workplace rights, contracts, and disputes.",
        fullDescription: "Navigate workplace challenges with confidence. Understand your rights regarding termination, salary, and contracts.",
        subdomains: [
            { id: "wage-disputes", title: "Salary & Wage Disputes", icon: Wallet },
            { id: "wrongful-termination", title: "Wrongful Termination", icon: UserCircle },
            { id: "contracts", title: "Employment Contracts & Bonds", icon: ClipboardCheck },
            { id: "pf-withdrawal", title: "PF / EPF Withdrawal & Issues", icon: Briefcase },
            { id: "harassment", title: "Workplace Harassment", icon: Shield }
        ]
    },
    {
        id: "property",
        name: "Property & Real Estate",
        icon: Home,
        shortDescription: "Buying, selling, and rental agreements.",
        fullDescription: "Secure your investments and housing rights. From due diligence to resolving disputes with builders or tenants.",
        subdomains: [
            { id: "due-diligence", title: "Buying Property (Due Diligence)", icon: FileSearch },
            { id: "rental-issues", title: "Rental Agreements & Tenant Issues", icon: Home },
            { id: "registration", title: "Property Registration & Stamp Duty", icon: FileText },
            { id: "land-ownership", title: "Land Ownership Disputes", icon: Scale },
            { id: "rera", title: "Builder Delays & RERA Complaints", icon: Building }
        ]
    },
    {
        id: "family",
        name: "Family & Personal",
        icon: Users,
        shortDescription: "Marriage, succession, and guardianship.",
        fullDescription: "Sensitive guidance for your personal life. We help with marriage registration, inheritance, and protection orders.",
        subdomains: [
            { id: "marriage", title: "Marriage Registration", icon: Heart },
            { id: "divorce", title: "Divorce & Separation", icon: UserCircle },
            { id: "custody", title: "Child Custody & Guardianship", icon: Users },
            { id: "succession", title: "Will & Succession Certificate", icon: FileText },
            { id: "domestic-violence", title: "Domestic Violence & Protection", icon: Shield }
        ]
    }
];

import { ShoppingCart } from "lucide-react";
