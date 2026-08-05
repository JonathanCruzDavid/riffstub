import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Contact</h1>
      <p className="mb-8 text-sm text-black/60 dark:text-white/60">
        Houselights is a one-person project, so a message here goes straight to the person who
        builds it. Replies won't be instant, but every message gets read.
      </p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-black/70 dark:text-white/70">
        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Get in touch
          </h2>
          <ContactForm />
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Reporting a post or account
          </h2>
          <p>
            If you're flagging a specific post or account for violating the{" "}
            <a href="/terms" className="underline">
              Terms of Service
            </a>
            , use the "Report" option on that post or profile instead — it goes straight into the
            review queue rather than an inbox, so it gets handled faster.
          </p>
        </section>
      </div>
    </div>
  );
}
