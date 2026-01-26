import { redirect } from 'next/navigation';

export default function PopularMusicPage() {
  // This route has been removed — redirect users to the library/manage page.
  redirect('/manage');
}