import type { Metadata } from 'next';
import ClerkThemeProvider from '@/components/ClerkThemeProvider';
import ConvexClerkProvider from '@/components/ConvexClerkProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Progress Tracker',
  description: 'Track client escalations from intake to resolution',
};

const themeScript = `
  try {
    var t = localStorage.getItem('cs-tm-theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ClerkThemeProvider>
          <ConvexClerkProvider>{children}</ConvexClerkProvider>
        </ClerkThemeProvider>
      </body>
    </html>
  );
}
