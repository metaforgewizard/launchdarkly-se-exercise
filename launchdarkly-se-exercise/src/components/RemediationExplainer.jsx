// Shown in the page body when the user clicks "Simulate Issue" on Exercise 1.
// This is the move that turns a checkbox-y Part 1 demo into something that
// shows real SE thinking: explaining what production remediation looks like.

export default function RemediationExplainer() {
  return (
    <aside className="remediation" role="alert" aria-live="polite">
      <div className="remediation__icon">⚠️</div>
      <div className="remediation__body">
        <h3 className="remediation__title">A customer is hitting an issue with the new checkout</h3>

        <p>
          In production, you'd be monitoring this rollout via{' '}
          <a
            href="https://launchdarkly.com/docs/home/observability"
            target="_blank"
            rel="noreferrer"
          >
            LaunchDarkly's Observability product
          </a>{' '}
          or a third-party tool like Datadog, New Relic, or Sentry. When the error rate
          on the <code>new-checkout</code> flag's variation crosses a threshold, your
          monitoring tool would fire an alert.
        </p>

        <p className="remediation__demo-step">
          <strong>For this demo:</strong> open your LaunchDarkly console and toggle the{' '}
          <code>new-checkout</code> flag back to <strong>OFF</strong>. The page will revert to the
          old checkout instantly — no reload, no redeploy. That's the streaming flag
          listener at work.
        </p>

        <p>
          <strong>In production:</strong> the same flip would be triggered automatically
          by a webhook from your observability tool — no human in the loop. LaunchDarkly's
          REST API exposes flag state as a PATCH endpoint:
        </p>

        <pre className="remediation__code">
{`curl -X PATCH \\
  https://app.launchdarkly.com/api/v2/flags/{project-key}/new-checkout \\
  -H "Authorization: $LD_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "patch": [
      {
        "op": "replace",
        "path": "/environments/production/on",
        "value": false
      }
    ]
  }'`}
        </pre>

        <p className="remediation__note">
          Or — without writing webhook code at all — you can wire LaunchDarkly's{' '}
          <a
            href="https://launchdarkly.com/docs/home/releases/triggers"
            target="_blank"
            rel="noreferrer"
          >
            flag triggers
          </a>{' '}
          directly to Datadog, New Relic, Honeycomb, Splunk, or a generic webhook.
          The trigger gives you a unique URL; when your observability tool POSTs
          to it, the flag flips. Zero glue code.
        </p>
      </div>
    </aside>
  );
}
