export type GalleryItem = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  updatedAt: string;
  hidden: boolean;
  public: boolean;
  thumbnail: { light: string; dark: string } | null;
};

export type GalleryFilter = {
  query: string;
  tags: string[];
  showHidden: boolean;
};
