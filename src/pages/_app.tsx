import { MantineProvider } from "@mantine/core";
import Layout from "@components/Layout";
import { type AppType } from "next/app";
import { trpc } from "@utils/trpc";


// should move this to the theme.
import "@styles/globals.css";
// should move this to the theme.
import "@styles/variables.css";
// should remove this
import "@styles/reset.css";
import "@styles/zero-inbox-overrides.css";


const MyApp: AppType<{ session: null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <MantineProvider withNormalizeCSS withGlobalStyles>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MantineProvider>
  );
};

export default trpc.withTRPC(MyApp);
