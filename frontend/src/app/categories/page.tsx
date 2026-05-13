import Header from "@/components/layout/Header";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getCategoryCount(genre: string): Promise<number> {
    try {
        const res = await fetch(
            `http://localhost:8000/api/books?genre=${encodeURIComponent(genre)}&page_size=1`,
            { cache: "no-store" }
        );
        if (!res.ok) return 0;
        const data = await res.json();
        return data.total ?? 0;
    } catch {
        return 0;
    }
}

export default async function CategoriesPage() {
    const counts = await Promise.all(
        CATEGORIES.map((cat) => getCategoryCount(cat.name))
    );

    const categoriesWithCounts = CATEGORIES.map((cat, i) => ({
        ...cat,
        count: counts[i],
    }));

    const totalBooks = categoriesWithCounts.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-7xl mx-auto px-8 md:px-16 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-3">
                        Browse by Category
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Explore our collection of{" "}
                        <span className="font-semibold text-primary">{totalBooks.toLocaleString()}+</span>{" "}
                        books across {CATEGORIES.length} genres
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categoriesWithCounts.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.name}
                                href={cat.href}
                                className="group flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 hover:shadow-md transition-all text-center"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Icon size={22} className="text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-text text-sm leading-tight">{cat.name}</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        {cat.count > 0 ? `${cat.count} books` : "—"}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
