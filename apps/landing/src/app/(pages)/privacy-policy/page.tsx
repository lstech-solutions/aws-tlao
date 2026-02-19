export default function PrivacyPolicy() {
  return (
    <>
      <div className="container-max section-padding max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              AI Agent Platform (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or
              &quot;Company&quot;) operates the website and services. This page informs you of our
              policies regarding the collection, use, and disclosure of personal data when you use
              our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information Collection and Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect several different types of information for various purposes to provide and
              improve our Service to you.
            </p>

            <h3 className="text-xl font-semibold mb-3">Types of Data Collected:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Personal Data:</strong> Email address, name,
                phone number, and other contact information
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong> Browser type, IP address,
                pages visited, time and date of visits
              </li>
              <li>
                <strong className="text-foreground">Document Data:</strong> Files and documents
                uploaded for processing by our AI agents
              </li>
              <li>
                <strong className="text-foreground">Cookies and Tracking:</strong> Information
                collected through cookies and similar technologies
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Use of Data</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              AI Agent Platform uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Security of Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              The security of your data is important to us but remember that no method of
              transmission over the Internet or method of electronic storage is 100% secure. While
              we strive to use commercially acceptable means to protect your Personal Data, we
              cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last
              updated&quot; date at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                Email:{' '}
                <a href="mailto:privacy@lstech.solutions" className="text-primary hover:underline">
                  privacy@lstech.solutions
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
