"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import InfiniteGrid from "@/components/infinite-grid-integration";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <main ref={containerRef} className="min-h-screen flex flex-col items-center overflow-x-hidden relative">
      <InfiniteGrid />

      {/* Navbar - Logo Only */}
      <nav className="w-full flex justify-center mt-8 mb-16 md:mb-24 z-10 relative">
        <Link href="/" className="mb-6 relative">
          <div className="relative w-40 h-14 md:w-40 md:h-20">
            <Image
              src="/biblomind-logoo.png"
              alt="BiblioMind Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-5xl w-full mb-20 px-4 z-10 relative">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight text-text"
          style={{ textShadow: "8px 8px 0px #b4d2b8" }}>
          Turn any bookshelf into your <br /> personal reading list.
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mt-4 leading-relaxed">
          Capture a photo of any book collection, and let our AI analyze it to
          find the perfect recommendations tailored to your unique taste.
        </p>

        {/* Real Images Section */}
        <motion.div
          className="w-full flex justify-center gap-6 md:gap-12 mb-24 items-end cursor-pointer"
          initial="rest"
          whileHover="hover"
          animate="rest"
        >
          {/* Left Book - LOTR */}
          <motion.div
            className="relative w-32 h-48 md:w-48 md:h-72 rounded-lg shadow-xl"
            variants={{
              rest: { x: 0, rotate: -6, transition: { duration: 0.5 } },
              hover: { x: -30, rotate: -12, transition: { duration: 0.4 } }
            }}
          >
            <Image
              src="/lotr.png"
              alt="Lord of the Rings"
              fill
              className="object-cover rounded-lg"
            />
          </motion.div>

          {/* Center Book - Nutuk (Active/Prominent) */}
          <motion.div
            className="relative w-40 h-56 md:w-56 md:h-80 rounded-lg shadow-2xl z-10"
            variants={{
              rest: { y: 0, scale: 1, transition: { duration: 0.5 } },
              hover: { y: -30, scale: 1.05, transition: { duration: 0.4 } }
            }}
          >
            <Image
              src="/nutuk.png"
              alt="Nutuk"
              fill
              className="object-cover rounded-lg"
            />
          </motion.div>

          {/* Right Book - Harry Potter */}
          <motion.div
            className="relative w-32 h-48 md:w-48 md:h-72 rounded-lg shadow-xl"
            variants={{
              rest: { x: 0, rotate: 6, transition: { duration: 0.5 } },
              hover: { x: 30, rotate: 12, transition: { duration: 0.4 } }
            }}
          >
            <Image
              src="/hp.png"
              alt="Harry Potter"
              fill
              className="object-cover rounded-lg"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Full Width CTA Section with Parallax Animation */}
      <section className="w-full overflow-hidden relative pb-20 z-10">
        <motion.div
          style={{ x }}
          className="w-full max-w-[90%] md:max-w-6xl mx-auto bg-[#e8e8e6] rounded-[3rem] py-20 flex flex-col items-center justify-center text-center px-8 shadow-sm"
        >
          <h2 className="text-3xl md:text-5xl font-semibold mb-12 text-text">
            Tired of judging books by their covers? <br />
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mt-4 leading-relaxed">
            Join today to discover stories that truly resonate with you.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-48 py-4 px-8 rounded-full text-lg font-bold transition-all duration-300 border-2 border-transparent bg-primary text-text shadow-lg hover:shadow-xl hover:bg-background hover:border-primary"
              >
                Register
              </motion.button>
            </Link>

            <Link href="/auth/login" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-48 py-4 px-8 rounded-full text-lg font-bold transition-all duration-300 border-2 border-transparent bg-secondary text-text shadow-lg hover:shadow-xl hover:bg-background hover:border-secondary"
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="w-full py-8 text-center text-gray-500 text-sm z-10 relative">
        © {new Date().getFullYear()} BiblioMind. All rights reserved.
      </footer>
    </main>
  );
}
