export const metadata = {
  title: "Privacy · CS2 Tracker",
  description: "How data is handled in CS2 Tracker.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Privacy</h1>
      <div className="prose prose-invert prose-zinc">
        <p>
          We designed CS2 Tracker to be <strong>local-first</strong>. Most data lives only in your
          browser.
        </p>
        <h3>What we store</h3>
        <ul>
          <li>
            <strong>Your rows</strong> (items you add/import) are stored in your browser’s{" "}
            <code>localStorage</code> under <code>cs2:dashboard:rows</code>.
          </li>
          <li>Pricing data is fetched from public sources and may be cached temporarily.</li>
        </ul>
        <h3>What we don’t store</h3>
        <ul>
          <li>No account data, passwords, or personal info.</li>
          <li>No server-side copies of your local rows.</li>
        </ul>
        <h3>Third-party data</h3>
        <p>
          Item images and prices may come from third-party services (e.g., Skinport/Steam). Their
          terms and privacy policies apply when you use their data.
        </p>
        <h3>Contact</h3>
        <p>
          Questions or concerns? Open an issue on{" "}
          <a className="underline" href="https://github.com/realuwy/cs2-tracker">GitHub</a>.
        </p>
      </div>
    </div>
  );
}
