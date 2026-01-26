// ============================================
// TYPES ET INTERFACES - Définitions TypeScript
// ============================================

export interface HeroImage {
  imageUrl: string;
  imageId: string;
  title: string;
  subTitle: string;
  color: string;
}

export interface CardItem {
  title: string;
  description: string;
  color: string;
}

export interface ValueItem {
  title: string;
  description: string;
  color: string;
}

export interface CtaButton {
  label: string;
  href: string;
  bgColor: string;
  textColor: string;
}

export interface PageContent {
  image: HeroImage;
  history: {
    subTitle: string;
    title: string;
    description: string;
    color: string;
  };
  cards: CardItem[];
  values: {
    subTitle: string;
    title: string;
    color: string;
    items: ValueItem[];
  };
  approach: {
    subTitle: string;
    title: string;
    description: string;
    color: string;
  };
  cta: {
    title: string;
    subTitle: string;
    color: string;
    buttons: CtaButton[];
  };
}

export interface PendingHeroImage {
  file: File;
  previewUrl: string;
}

export interface EditAboutModalProps {
  open: boolean;
  onClose: () => void;
}
export interface EditModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
}

export interface SectionConfig {
  id: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  color: string;
  gradient: string;
}

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export interface ToastState {
  msg: string;
  type: "success" | "error" | "warning" | "info";
}