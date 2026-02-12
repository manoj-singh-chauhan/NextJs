import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <Link href="/auth/signup" className="text-blue-500 underline">
        Go to Signup Page
      </Link>
    </div>
  );
}