'use client';
import dynamic from 'next/dynamic';

// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./providers'), {
ssr: false,
});

export default function ClientWrapper({ children }) {
return <WalletProviders>{children}</WalletProviders>;
}