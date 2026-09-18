import { MediaBanner } from "@/components/home";
import { PageTitle } from "@/components/ui";
export const metadata = { title: "Media" };
export default function Page() {
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="BEYOND THE FINAL WHISTLE"
        title="NSL MEDIA ARCHIVE"
        description="The league, through our lens."
      />
      <MediaBanner />
      <div className="media-note">
        <h2>Every match has a story.</h2>
        <p>
          Explore the shared Google Drive for league photos and videos. The
          archive opens in a new tab; a Google account may be needed to access
          shared content.
        </p>
      </div>
    </div>
  );
}
