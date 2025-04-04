'use client';

import React from 'react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          ZetaRaffle
        </Link>
        <nav className="flex space-x-6">
          <Link href="/" className="text-gray-700 hover:text-indigo-600">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-indigo-600">
            About
          </Link>
          <Link href="/how-it-works" className="text-gray-700 hover:text-indigo-600">
            How It Works
          </Link>
        </nav>
      </div>
    </header>
  );
}