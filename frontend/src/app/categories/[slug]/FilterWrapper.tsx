"use client";

import { useRouter } from "next/navigation";
import BookFilter, { FilterState } from "@/components/books/BookFilter";

export default function FilterWrapper({ slug, initialFilters }: { slug: string, initialFilters: any }) {
    const router = useRouter();

    const handleFilterChange = (filters: FilterState) => {
        const params = new URLSearchParams();

        if (filters.title) params.set("title", filters.title);
        if (filters.author) params.set("author", filters.author);
        if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
        if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());

        router.push(`/categories/${slug}?${params.toString()}`);
    };

    return (
        <BookFilter
            selectedCategory={slug}
            onFilterChange={handleFilterChange}
        />
    );
}
