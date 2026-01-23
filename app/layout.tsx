"use client";

import "./globals.css";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ConnectionProvider } from "@/context/ConnectionContext";
import Layout from "@/components/layout/Layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <ConnectionProvider>
              {/* <Layout> */}
                {children}
              {/* </Layout> */}
              </ConnectionProvider>
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
