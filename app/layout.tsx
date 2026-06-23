import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cost-to-Cost Revenue Dashboard',
  description: 'Project financial tracking and revenue recognition built with Next.js and Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('sap-cn41-theme');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.dataset.theme = theme;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
