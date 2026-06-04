'use client';

import { useEffect, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const baseVars = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  borderRadius: '10px',
  fontSize: '14px',
};

// ---------- Dark theme ----------
const darkColors = {
  surface: '#171717',
  surface2: '#262626',
  border: '#404040',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  primary: '#d4d4d4',
  primaryHover: '#e5e5e5',
  danger: '#f87171',
};

const darkAppearance = {
  baseTheme: dark,
  variables: {
    ...baseVars,
    colorPrimary: darkColors.primary,
    colorBackground: darkColors.surface,
    colorInputBackground: darkColors.surface2,
    colorText: darkColors.text,
    colorTextSecondary: darkColors.textMuted,
    colorNeutral: darkColors.border,
    colorDanger: darkColors.danger,
  },
  elements: {
    // Auth card (SignIn / SignUp)
    rootBox: { width: '100%', maxWidth: '420px' },
    cardBox: {
      backgroundColor: darkColors.surface,
      border: `1px solid ${darkColors.border}`,
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
      borderRadius: '14px',
    },
    card: {
      backgroundColor: darkColors.surface,
      boxShadow: 'none',
      border: 'none',
    },
    headerTitle: { color: darkColors.text, fontSize: '20px', fontWeight: 700 },
    headerSubtitle: { color: darkColors.textMuted, fontSize: '13px' },
    formFieldLabel: { color: darkColors.text, fontSize: '13px', fontWeight: 500 },
    formFieldInput: {
      backgroundColor: darkColors.surface2,
      border: `1px solid ${darkColors.border}`,
      color: darkColors.text,
      '&:focus': {
        borderColor: darkColors.primary,
        boxShadow: `0 0 0 3px rgba(129, 140, 248, 0.2)`,
        outline: 'none',
      },
    },
    formFieldHintText: { color: darkColors.textMuted },
    formButtonPrimary: {
      backgroundColor: darkColors.primary,
      color: '#ffffff',
      boxShadow: 'none',
      textTransform: 'none',
      fontWeight: 500,
      '&:hover': { backgroundColor: darkColors.primaryHover, boxShadow: 'none' },
      '&:focus': { backgroundColor: darkColors.primaryHover, boxShadow: 'none' },
    },
    formFieldAction: { color: darkColors.primary, fontWeight: 500 },
    identityPreviewEditButton: { color: darkColors.primary },
    formResendCodeLink: { color: darkColors.primary },
    footer: {
      backgroundColor: darkColors.surface,
      borderTop: `1px solid ${darkColors.border}`,
    },
    footerActionText: { color: darkColors.textMuted },
    footerActionLink: {
      color: darkColors.primary,
      fontWeight: 500,
      '&:hover': { color: darkColors.primaryHover, textDecoration: 'underline' },
    },
    dividerLine: { backgroundColor: darkColors.border },
    dividerText: {
      color: darkColors.textMuted,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: 600,
    },
    socialButtonsBlockButton: {
      backgroundColor: darkColors.surface2,
      border: `1px solid ${darkColors.border}`,
      color: darkColors.text,
      boxShadow: 'none',
      '&:hover': {
        borderColor: darkColors.primary,
        backgroundColor: darkColors.surface,
        boxShadow: 'none',
      },
    },
    socialButtonsBlockButtonText: { color: darkColors.text },
    alert: {
      backgroundColor: 'rgba(248, 113, 113, 0.08)',
      border: `1px solid rgba(248, 113, 113, 0.3)`,
      color: darkColors.danger,
    },
    alertText: { color: darkColors.danger },
    otpCodeFieldInput: {
      backgroundColor: darkColors.surface2,
      border: `1px solid ${darkColors.border}`,
      color: darkColors.text,
    },

    // UserButton (avatar in topbar)
    userButtonAvatarBox: { width: '36px', height: '36px' },
    userButtonPopoverCard: {
      backgroundColor: darkColors.surface,
      border: `1px solid ${darkColors.border}`,
      color: darkColors.text,
    },
    userButtonPopoverMain: { backgroundColor: darkColors.surface },
    userButtonPopoverActionButton: {
      color: darkColors.text,
      backgroundColor: 'transparent',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: 'transparent',
        color: darkColors.text,
        boxShadow: 'none',
      },
      '&:focus': {
        backgroundColor: 'transparent',
        color: darkColors.text,
        boxShadow: 'none',
      },
      '&:active': {
        backgroundColor: 'transparent',
        color: darkColors.text,
        boxShadow: 'none',
      },
    },
    userButtonPopoverActionButtonText: {
      color: darkColors.text,
      '&:hover': { color: darkColors.text },
    },
    userButtonPopoverActionButtonIcon: {
      color: darkColors.textMuted,
      '&:hover': { color: darkColors.textMuted },
    },
    userButtonPopoverFooter: {
      backgroundColor: darkColors.surface2,
      borderTop: `1px solid ${darkColors.border}`,
    },
    userPreviewMainIdentifier: { color: darkColors.text, fontWeight: 600 },
    userPreviewSecondaryIdentifier: { color: darkColors.textMuted },
  },
};

// ---------- Light theme ----------
const lightColors = {
  surface: '#ffffff',
  surface2: '#f5f5f5',
  border: '#e5e5e5',
  text: '#171717',
  textMuted: '#525252',
  primary: '#171717',
  primaryHover: '#262626',
  danger: '#dc2626',
};

const lightAppearance = {
  variables: {
    ...baseVars,
    colorPrimary: lightColors.primary,
    colorBackground: lightColors.surface,
    colorInputBackground: lightColors.surface2,
    colorText: lightColors.text,
    colorTextSecondary: lightColors.textMuted,
    colorNeutral: lightColors.border,
    colorDanger: lightColors.danger,
  },
  elements: {
    rootBox: { width: '100%', maxWidth: '420px' },
    cardBox: {
      backgroundColor: lightColors.surface,
      border: `1px solid ${lightColors.border}`,
      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
      borderRadius: '14px',
    },
    card: {
      backgroundColor: lightColors.surface,
      boxShadow: 'none',
      border: 'none',
    },
    headerTitle: { color: lightColors.text, fontSize: '20px', fontWeight: 700 },
    headerSubtitle: { color: lightColors.textMuted, fontSize: '13px' },
    formFieldLabel: { color: lightColors.text, fontSize: '13px', fontWeight: 500 },
    formFieldInput: {
      backgroundColor: lightColors.surface2,
      border: `1px solid ${lightColors.border}`,
      color: lightColors.text,
      '&:focus': {
        borderColor: lightColors.primary,
        boxShadow: `0 0 0 3px rgba(79, 70, 229, 0.18)`,
        outline: 'none',
      },
    },
    formButtonPrimary: {
      backgroundColor: lightColors.primary,
      color: '#ffffff',
      boxShadow: 'none',
      textTransform: 'none',
      fontWeight: 500,
      '&:hover': { backgroundColor: lightColors.primaryHover, boxShadow: 'none' },
    },
    footer: {
      backgroundColor: lightColors.surface,
      borderTop: `1px solid ${lightColors.border}`,
    },
    footerActionText: { color: lightColors.textMuted },
    footerActionLink: { color: lightColors.primary, fontWeight: 500 },
    dividerLine: { backgroundColor: lightColors.border },
    dividerText: {
      color: lightColors.textMuted,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: 600,
    },
    socialButtonsBlockButton: {
      backgroundColor: lightColors.surface2,
      border: `1px solid ${lightColors.border}`,
      color: lightColors.text,
      boxShadow: 'none',
      '&:hover': {
        borderColor: lightColors.primary,
        backgroundColor: lightColors.surface,
        boxShadow: 'none',
      },
    },
    socialButtonsBlockButtonText: { color: lightColors.text },
    userButtonAvatarBox: { width: '36px', height: '36px' },
    userButtonPopoverCard: {
      backgroundColor: lightColors.surface,
      border: `1px solid ${lightColors.border}`,
      color: lightColors.text,
    },
    userButtonPopoverActionButton: {
      color: lightColors.text,
      backgroundColor: 'transparent',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: 'transparent',
        color: lightColors.text,
        boxShadow: 'none',
      },
      '&:focus': {
        backgroundColor: 'transparent',
        color: lightColors.text,
        boxShadow: 'none',
      },
      '&:active': {
        backgroundColor: 'transparent',
        color: lightColors.text,
        boxShadow: 'none',
      },
    },
    userButtonPopoverActionButtonText: {
      color: lightColors.text,
      '&:hover': { color: lightColors.text },
    },
    userButtonPopoverActionButtonIcon: {
      color: lightColors.textMuted,
      '&:hover': { color: lightColors.textMuted },
    },
    userPreviewMainIdentifier: { color: lightColors.text, fontWeight: 600 },
    userPreviewSecondaryIdentifier: { color: lightColors.textMuted },
  },
};

export default function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const update = () => {
      const t = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      setTheme(t);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <ClerkProvider appearance={theme === 'dark' ? darkAppearance : lightAppearance}>
      {children}
    </ClerkProvider>
  );
}
