import React from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

// --- Types ---
// Doit correspondre à la structure de données de votre ContactEditor
interface ContactData {
  titre: string;
  sousTitre: string;
  email: string;
  telephone: string;
  adresse: string;
  googleMapLink?: string; // Champ optionnel pour le lien Google Map
  horaires: string;
}

interface ContactPreviewProps {
  data: ContactData | null;
}

const ContactPreview: React.FC<ContactPreviewProps> = ({ data }) => {
  // Affichage squelette ou vide si les données ne sont pas encore chargées
  if (!data) {
    return (
      <div className="bg-[#F5F3EF] p-8 rounded-xl shadow-sm max-w-md mx-auto h-[400px] flex items-center justify-center text-[#6B6B6B]">
        Chargement de l'aperçu...
      </div>
    );
  }

  // Construction dynamique de la liste basée sur les props data
  const contactList = [
    {
      icon: <Mail size={24} className="text-[#8B9589]" />,
      label: "Email",
      value: data.email,
      href: `mailto:${data.email}`,
    },
    {
      icon: <Phone size={24} className="text-[#D4BCA9]" />,
      label: "Téléphone",
      value: data.telephone,
      href: `tel:${data.telephone.replace(/\s/g, "")}`, // Nettoie les espaces pour le lien tel:
    },
    {
      icon: <MapPin size={24} className="text-[#D4BCA9]" />,
      label: "Adresse",
      value: data.adresse,
      href:
        data.googleMapLink && data.googleMapLink.length > 0
          ? data.googleMapLink
          : undefined,
      target: "_blank",
    },
    {
      icon: <Clock size={24} className="text-[#8B9589]" />,
      label: "Horaires",
      value: data.horaires,
      href: undefined,
    },
  ];

  return (
    <div className="bg-[#F5F3EF] p-8 rounded-xl shadow-sm max-w-md mx-auto font-sans">
      <h2 className="text-3xl font-bold text-[#2d2d2d] mb-3">
        {data.titre || "Nos coordonnées"}
      </h2>
      <p className="text-[#6B6B6B] mb-10 text-base">
        {data.sousTitre || "N'hésitez pas à nous contacter."}
      </p>

      <div className="space-y-6">
        {contactList.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="bg-[#EAE8E3] p-3 rounded-lg flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B]">{item.label}</p>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.target || "_self"}
                  rel={
                    item.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                  className="text-base text-[#2d2d2d] font-medium hover:underline hover:text-[#616637] transition-colors"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-base text-[#2d2d2d] font-medium">
                  {item.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactPreview;
