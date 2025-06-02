import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">🤖 ClaimBot</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}