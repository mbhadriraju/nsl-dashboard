import { StandingsTable } from "@/components/home";
import { DataBoundary, PageTitle } from "@/components/ui";
export const metadata = { title: "Standings" };
export default function Page() {
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="THE RACE FOR THE TOP"
        title="NSL STANDINGS"
        description="Week 1 · Every point matters."
      />
      <DataBoundary>
        <section className="panel full-standings">
          <StandingsTable />
        </section>
        <p className="table-note">
          Official Week 1 standings. Clubs ranked by points, then goals.
        </p>
      </DataBoundary>
    </div>
  );
}
