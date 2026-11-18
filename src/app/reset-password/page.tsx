import { Suspense } from "react";
import Link from "next/link";
import { ResetForm } from "./ResetForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <div className="animate-in w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            FitCast AI
          </Link>
          <h1 className="font-serif text-3xl mt-6">Choose a new password</h1>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
