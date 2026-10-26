import { SiteHeader } from "@/components/Headers";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl space-y-4 px-4 py-20 sm:px-6">
        <h1 className="text-3xl">This page doesn&apos;t exist</h1>
        <p className="text-muted">The link may be out of date. Head back and pick up from there.</p>
        <ButtonLink href="/">Go to the home page</ButtonLink>
      </main>
    </>
  );
}
