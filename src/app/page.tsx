import { getStaticProducts } from "@/lib/static-catalog";
import { HomeView } from "@/views/HomeView";
import { homeFeatured } from "@/views/view-models";

// Server Component: this runs at build time, so the products below are baked
// into index.html and are visible to crawlers with no JavaScript.
export default async function HomePage() {
  return <HomeView featured={homeFeatured(await getStaticProducts())} />;
}
