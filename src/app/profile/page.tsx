import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { AddressForm } from "@/components/profile/address-form";

export const metadata: Metadata = {
  title: "Profile - BINWAHAB",
  description: "Manage your BINWAHAB account",
};

interface ProfilePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const showAddressForm = searchParams["add-address"] === "true";

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {showAddressForm ? "Add New Address" : "Your Profile"}
        </h1>
        <div className="bg-white shadow rounded-lg p-6">
          {showAddressForm ? (
            <AddressForm />
          ) : (
            <ProfileForm user={session.user} />
          )}
        </div>
      </div>
    </div>
  );
} 