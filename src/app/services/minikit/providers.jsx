import { ReactNode } from "react";

import { ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function WalletProviders({ children }) {

    return(
        <QueryClientProvider client={queryClient}>
            <ProvidersClientWrapper>
                {children}
            </ProvidersClientWrapper>
        </QueryClientProvider>
    );

}