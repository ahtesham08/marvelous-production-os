import { getCurrentUserContext } from "@/lib/serverAuth";

export default async function NotApprovedPage() {
  const context = await getCurrentUserContext();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
      <section className="rounded-lg border border-danger/25 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase text-danger">Access Pending</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Your account is not approved.</h1>
        <p className="mt-3 text-sm leading-6 text-black/65">
          Ask Admin to add your email in Marvelous Production OS before you can access the team dashboard.
        </p>
        {context.authEmail ? <p className="mt-4 rounded-md bg-[#f6f4ee] p-3 text-sm font-medium text-ink">{context.authEmail}</p> : null}
      </section>
    </div>
  );
}
