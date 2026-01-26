import { redirect } from 'next/navigation';

export default function LibraryPage() {
  // Library view has been merged into Manage — redirect to /manage
  redirect('/manage');
}