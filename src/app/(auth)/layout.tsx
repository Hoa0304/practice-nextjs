import Link from "next/link";

export default function AuthLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
     <div>
        <div>
            <Link href={'/'}>Home</Link>
        </div>
        {children}
     </div>
    );
  }
  