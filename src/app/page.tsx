import AIConversation from "@/components/AIConversation";
import LanguagePractice from "@/components/LanguageMain";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">English Speaking Practice</h1>
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
        <LanguagePractice />
        <AIConversation />
      </div>
    </main>
  );
}
