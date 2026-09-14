import Link from "next/link";
import { Page } from "@/components/layout/page";
import { SearchBox } from "@/components/search/search-box";

/** Large type, one line of copy, a way home and a way to search. */
export default function NotFound() {
  return (
    <Page width="narrow" className="flex flex-1 flex-col justify-center py-24 text-center">
      <p className="display-serif text-[clamp(6rem,28vw,14rem)] leading-none text-foreground/15">404</p>
      <h1 className="display-serif -mt-6 text-3xl sm:text-4xl">Seek, and ye shall find. Just not here.</h1>
      <p className="mt-3 text-muted-foreground">This page is not on Scriptune. The hymn or verse you wanted probably is.</p>
      <div className="mx-auto mt-8 w-full max-w-md"><SearchBox size="md" /></div>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/" className="underline-offset-4 hover:underline">Identify something</Link>
        <Link href="/explore" className="underline-offset-4 hover:underline">Explore</Link>
      </div>
    </Page>
  );
}
