import SetupInstructions from "./setup-instructions";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full bg-card rounded-lg shadow-lg p-8 border">
        <h1 className="text-3xl font-bold text-center mb-6 text-card-foreground">
          Welcome to Stock Tracker
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          It looks like your database isn&apos;t set up yet. Follow the
          instructions below to get started.
        </p>

        <SetupInstructions />
      </div>
    </div>
  );
}
