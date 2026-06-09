import { LoadingMascot } from "@/components/business-data/LoadingMascot";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
      <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <LoadingMascot
          label="Loading Tech Revenue Brief..."
          description="The AI cat is getting the next page ready."
          showBusinessDataLink
        />
      </div>
    </main>
  );
}
