import type { OAuthProviderId } from "@/lib/auth-oauth-providers";

type OAuthProviderIconProps = {
  provider: OAuthProviderId;
  className?: string;
};

export function OAuthProviderIcon({ provider, className = "h-5 w-5" }: OAuthProviderIconProps) {
  switch (provider) {
    case "google":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6S8.9 6.1 12 6.1c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.5 3.7 14.4 2.8 12 2.8 7.2 2.8 3.3 6.7 3.3 11.5S7.2 20.2 12 20.2c6.9 0 8.6-4.8 8.6-7.3 0-.5 0-.9-.1-1.2H12z"
          />
          <path
            fill="#34A853"
            d="M3.7 7.9 6.5 10c.8-2.4 2.9-4 5.5-4 1.8 0 3 .8 3.7 1.4l2.5-2.4C16.5 3.7 14.4 2.8 12 2.8 9 2.8 6.4 4.4 5 6.7l-1.3-1.2z"
          />
          <path
            fill="#FBBC05"
            d="M12 20.2c3.1 0 5.7-1 7.6-2.7l-3.6-2.8c-1 .7-2.3 1.2-4 1.2-3.1 0-5.7-2.1-6.6-5l-3.5 2.7c1.8 3.6 5.5 6.1 9.1 5.6z"
          />
          <path
            fill="#4285F4"
            d="M20.6 12.3c0-.5 0-.9-.1-1.2H12v3.6h4.9c-.2 1.1-.9 2.7-2.5 3.8l3.6 2.8c2.1-1.9 3.3-4.7 3.3-8z"
          />
        </svg>
      );
    case "azure":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#F25022" d="M3 3h9.2v9.2H3z" />
          <path fill="#7FBA00" d="M12.8 3H22v9.2h-9.2z" />
          <path fill="#00A4EF" d="M3 12.8h9.2V22H3z" />
          <path fill="#FFB900" d="M12.8 12.8H22V22h-9.2z" />
        </svg>
      );
    case "linkedin_oidc":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#0A66C2"
            d="M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8c0 .33.27.6.6.6h16.8c.33 0 .6-.27.6-.6V3.6c0-.33-.27-.6-.6-.6zM8.3 18.3H5.5V9.8h2.8v8.5zM6.9 8.5a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm11.4 9.8h-2.8v-4.1c0-1 0-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2v4.2h-2.8V9.8h2.7v1.1h.04c.4-.7 1.3-1.4 2.6-1.4 2.8 0 3.3 1.8 3.3 4.2v4.6z"
          />
        </svg>
      );
    case "github":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.28 5.69.42.36.79 1.07.79 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A10.5 10.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
      );
    default:
      return null;
  }
}
