export default function TermsOfService() {
  return (
    <>
      <div className="container-max section-padding max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using this website and service, you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to abide by the above,
              please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information
              or software) on AI Agent Platform&apos;s website for personal, non-commercial
              transitory viewing only. This is the grant of a license, not a transfer of title, and
              under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>
                Attempting to decompile or reverse engineer any software contained on the website
              </li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>
                Transferring the materials to another person or &quot;mirroring&quot; the materials
                on any other server
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials on AI Agent Platform&apos;s website are provided on an &apos;as is&apos;
              basis. AI Agent Platform makes no warranties, expressed or implied, and hereby
              disclaims and negates all other warranties including, without limitation, implied
              warranties or conditions of merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall AI Agent Platform or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the materials on AI Agent
              Platform&apos;s website, even if AI Agent Platform or an authorized representative has
              been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Accuracy of Materials</h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials appearing on AI Agent Platform&apos;s website could include technical,
              typographical, or photographic errors. AI Agent Platform does not warrant that any of
              the materials on its website are accurate, complete, or current. AI Agent Platform may
              make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              AI Agent Platform has not reviewed all of the sites linked to its website and is not
              responsible for the contents of any such linked site. The inclusion of any link does
              not imply endorsement by AI Agent Platform of the site. Use of any such linked website
              is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              AI Agent Platform may revise these terms of service for its website at any time
              without notice. By using this website, you are agreeing to be bound by the then
              current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws
              of the jurisdiction in which AI Agent Platform operates, and you irrevocably submit to
              the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                Email:{' '}
                <a href="mailto:legal@lstech.solutions" className="text-primary hover:underline">
                  legal@lstech.solutions
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
