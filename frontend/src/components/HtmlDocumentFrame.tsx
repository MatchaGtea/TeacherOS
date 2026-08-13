export function HtmlDocumentFrame({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  return <iframe className="document-frame" title={title} srcDoc={html} />;
}
