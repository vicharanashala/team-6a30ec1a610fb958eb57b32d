import { redirect } from 'next/navigation';

// The AI assistant lives on the home page (/).
// This route exists for deep-linking from navbar/external refs — redirect cleanly.
export default function AskAIRedirect() {
  redirect('/');
}
