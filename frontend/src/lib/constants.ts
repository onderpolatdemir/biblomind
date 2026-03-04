import {
    Book, BookOpen, BookMarked, Brain, Rocket, Sparkles,
    Heart, PenTool, Landmark, Zap,
    Feather, Scroll, Shield, Search, Flame,
    User, Globe, Star, Compass, Microscope
} from "lucide-react";

export const CATEGORIES = [
    { name: "Fiction",            href: "/categories/fiction",            icon: Book },
    { name: "Fantasy",            href: "/categories/fantasy",            icon: Sparkles },
    { name: "Romance",            href: "/categories/romance",            icon: Heart },
    { name: "Classics",           href: "/categories/classics",           icon: Scroll },
    { name: "Young Adult",        href: "/categories/young-adult",        icon: Star },
    { name: "Historical Fiction", href: "/categories/historical-fiction", icon: Landmark },
    { name: "Mystery",            href: "/categories/mystery",            icon: Search },
    { name: "Science Fiction",    href: "/categories/science-fiction",    icon: Rocket },
    { name: "Nonfiction",         href: "/categories/nonfiction",         icon: BookOpen },
    { name: "Childrens",          href: "/categories/childrens",          icon: BookMarked },
    { name: "Thriller",           href: "/categories/thriller",           icon: Zap },
    { name: "Crime",              href: "/categories/crime",              icon: Shield },
    { name: "Horror",             href: "/categories/horror",             icon: Flame },
    { name: "Dystopia",           href: "/categories/dystopia",           icon: Brain },
    { name: "Biography",          href: "/categories/biography",          icon: User },
    { name: "Memoir",             href: "/categories/memoir",             icon: Feather },
    { name: "Psychology",         href: "/categories/psychology",         icon: Microscope },
    { name: "Philosophy",         href: "/categories/philosophy",         icon: PenTool },
    { name: "Adventure",          href: "/categories/adventure",          icon: Compass },
    { name: "History",            href: "/categories/history",            icon: Globe },
];
