import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

export const metadata = {
  title: 'NextFlow — AI Workflow Builder',
  description: 'Build, execute, and manage LLM-based workflows with a visual node editor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { 
          colorPrimary: '#8b5cf6', 
          colorBackground: '#18181b', 
          colorInputBackground: '#27272a',
          colorText: 'white',
          colorInputText: 'white'
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
