import { APP_NAME } from "@constants/Constants";
import { AppShell } from "@mantine/core";
import Header from "@components/Header";
import Head from "next/head";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div>
        <Head>
          <title>{APP_NAME}</title>
          <link rel="icon" href="/logo.ico" />
          <meta name="description" content="All the info, at your Fingertips." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="og:title" content={APP_NAME} />
        </Head>
        {
          <AppShell
            padding={0}
            navbarOffsetBreakpoint="md"
            header={<Header />}
          >
            {children}
          </AppShell>
        }
      </div>
    </>
  );
}
