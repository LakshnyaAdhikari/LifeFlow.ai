
export interface SubIssue {
    id: string;
    title: string;
    description: string;
    isUrgent?: boolean;
}

export interface DocumentModule {
    id: string;
    title: string;
    icon: string; // Lucide icon name or path
    description: string;
    authority: string;
    subIssues: SubIssue[];
}

export const IDENTITY_MODULES: DocumentModule[] = [
    {
        id: "aadhaar",
        title: "Aadhaar Card",
        icon: "Fingerprint",
        description: "Unique 12-digit identity number issued by UIDAI.",
        authority: "UIDAI (Unique Identification Authority of India)",
        subIssues: [
            { id: "new-enrollment", title: "New Enrollment", description: "Apply for a fresh Aadhaar card." },
            { id: "update-address", title: "Update Address", description: "Change your address in Aadhaar." },
            { id: "lost-aadhaar", title: "Lost Aadhaar", description: "Recover a lost or forgotten Aadhaar number/card.", isUrgent: true },
            { id: "biometric-lock", title: "Biometric Lock/Unlock", description: "Secure your biometric data." },
            { id: "link-mobile", title: "Link Mobile Number", description: "Update or link your mobile number." },
        ]
    },
    {
        id: "pan",
        title: "PAN Card",
        icon: "CreditCard",
        description: "Permanent Account Number for financial transactions.",
        authority: "Income Tax Department",
        subIssues: [
            { id: "correction", title: "Correction/Update", description: "Fix errors in name, DOB, or father's name." },
            { id: "reprint", title: "Reprint PAN", description: "Request a physical card reprint." },
            { id: "link-aadhaar", title: "Link Aadhaar", description: "Mandatory linking of Aadhaar with PAN.", isUrgent: true },
        ]
    },
    {
        id: "passport",
        title: "Passport",
        icon: "Globe",
        description: "Official travel document issued by Gov of India.",
        authority: "Passport Seva (MEA)",
        subIssues: [
            { id: "new-passport", title: "New Passport", description: "Apply for a fresh passport." },
            { id: "renewal", title: "Renewal/Reissue", description: "Renew an expired or expiring passport." },
            { id: "tatkal", title: "Tatkal Scheme", description: "Urgent passport application." },
            { id: "police-clearance", title: "PCC", description: "Police Clearance Certificate." },
        ]
    },
    {
        id: "voter-id",
        title: "Voter ID",
        icon: "Vote",
        description: "Electors Photo Identity Card (EPIC).",
        authority: "Election Commission of India",
        subIssues: [
            { id: "new-voter", title: "New Voter Registration", description: "Form 6 for new voters." },
            { id: "correction", title: "Correction of Entries", description: "Form 8 for corrections." },
            { id: "transfer", title: "Constituency Transfer", description: "Shift to a new constituency." },
        ]
    },
    {
        id: "driving-license",
        title: "Driving License",
        icon: "Car",
        description: "Official specific permission to drive vehicles.",
        authority: "Parivahan / RTO",
        subIssues: [
            { id: "renewal", title: "Renewal", description: "Renew an expired license." },
            { id: "address-change", title: "Address Change", description: "Update address on DL." },
            { id: "duplicate", title: "Duplicate DL", description: "If original is lost or torn." },
        ]
    }
];
