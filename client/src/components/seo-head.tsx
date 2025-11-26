import { Helmet } from "react-helmet-async";

const SITE_URL = "https://crmlaunch.co.uk";
const DEFAULT_IMAGE = "https://crmlaunch.co.uk/assets/crm_dashboard_mockup-CLxWV89o.png";

type SeoHeadProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
  noindex?: boolean;
};

export function SeoHead({
  title,
  description,
  canonicalPath,
  ogImage = DEFAULT_IMAGE,
  structuredData,
  noindex = false,
}: SeoHeadProps) {
  const canonicalUrl = canonicalPath
    ? `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`
    : SITE_URL;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

