import { Suspense } from "react";
import Header from "@/components/layout/Header";
import BookFilter, { FilterState } from "@/components/books/BookFilter";
import BookGrid from "@/components/books/BookGrid";
import Link from "next/link";
import { RedirectType, redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

// Force dynamic rendering since we rely on searchParams
export const dynamic = "force-dynamic";

async function getBooks(category: string, searchParams: any) {
    const params = new URLSearchParams();

    // Find the correct category name from our constants using the slug
    // This ensures we match "Sci-Fi" correctly instead of "Sci Fi" or "Sci-fi"
    const matchedCategory = CATEGORIES.find(c => c.href.endsWith(`/${category}`));
    let genre = matchedCategory ? matchedCategory.name : category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    // Just in case, if no match found and it's something like "sci-fi", we rely on the backend's improved search
    params.append("genre", genre);

    if (searchParams.title) params.append("title", searchParams.title as string);
    if (searchParams.author) params.append("author", searchParams.author as string);
    if (searchParams.minPrice) params.append("min_price", searchParams.minPrice as string);
    if (searchParams.maxPrice) params.append("max_price", searchParams.maxPrice as string);

    if (searchParams.sort_by) params.append("sort_by", searchParams.sort_by as string);
    if (searchParams.sort_order) params.append("sort_order", searchParams.sort_order as string);

    params.append("page_size", "20");

    try {
        const res = await fetch(`http://localhost:8000/api/books?${params.toString()}`, {
            cache: "no-store",
        });

        if (!res.ok) {
            console.error("Failed to fetch books", await res.text());
            return [];
        }

        const data = await res.json();
        return data.items || [];
    } catch (e) {
        console.error("Fetch error", e);
        return [];
    }
}

export default async function CategoryPage({
    params,
    searchParams
}: {
    params: { slug: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const { slug } = params;

    // Fetch books on the server
    const books = await getBooks(slug, searchParams);

    // Client wrapper for Filter to handle routing
    // We pass the partial implementation of the filter logic to the client component

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-7xl mx-auto px-8 md:px-16 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/home" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="font-bold text-text capitalize">{slug.replace("-", " ")}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Sidebar: Filters */}
                    {/* We used a Client Component for filters. We need to wrap it to handle URL updates 
                        or modify BookFilter to use useRouter() internaly. 
                        Let's assume BookFilter uses callbacks, but here we want to update the URL.
                    */}
                    <FilterWrapper slug={slug} initialFilters={searchParams} />

                    {/* Right Content: Books Grid */}
                    <div className="flex-1">
                        <BookGrid
                            books={books}
                            isLoading={false}
                            genre={CATEGORIES.find(c => c.href.endsWith(`/${slug}`))?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

// Client Component Wrapper for the Filter to handle URL updates
import FilterWrapper from "./FilterWrapper"; 
