export type ArticleStatus = "published" | "draft";

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  key_takeaways: string[];
  category: string;
  source_name: string;
  source_url: string;
  image_url: string | null;
  share_id: string;
  status: ArticleStatus;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ArticleSummary = Pick<
  Article,
  | "id"
  | "title"
  | "slug"
  | "meta_description"
  | "key_takeaways"
  | "category"
  | "source_name"
  | "source_url"
  | "image_url"
  | "share_id"
  | "published_at"
>;

export type Source = {
  id: string;
  name: string;
  rss_url: string;
  category: string;
  is_active: boolean;
  last_scraped_at: string | null;
};
