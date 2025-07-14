"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

interface EligibilityMap {
  [company: string]: {
    eligible: boolean;
    date?: string;
  };
}

interface EligibleCompany {
  name: string;
  date?: string;
}

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [eligibleCompanies, setEligibleCompanies] = useState<EligibleCompany[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        await fetchEligibility(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchEligibility = async (uid: string) => {
    try {
      const q = query(collection(db, "submissions"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        const eligibility: EligibilityMap = data.eligibility || {};

        const eligible = Object.entries(eligibility)
          .filter(([, value]) => value.eligible)
          .map(([company, value]) => ({
            name: company.replace(/_/g, " ").toUpperCase(),
            date: value.date,
          }));

        setEligibleCompanies(eligible);
      }
    } catch (err) {
      console.error("Error fetching eligibility:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
          Interview Eligibility
        </h1>
        <hr className="mb-6 border-gray-300" />

        {loading ? (
          <p className="text-center text-gray-500">Checking eligibility...</p>
        ) : eligibleCompanies.length > 0 ? (
          <>
            <p className="text-gray-700 mb-4 text-center">
              You are eligible for the following interviews:
            </p>
            <ul className="space-y-3">
              {eligibleCompanies.map(({ name, date }) => (
                <li
                  key={name}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 shadow-sm"
                >
                  <div className="font-medium">{name}</div>
                  {date && (
                    <div className="text-sm text-gray-600">
                      Interview Date:{" "}
                      <span className="font-semibold">{date}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-center text-gray-600">
            You are currently not eligible for any interviews.
          </p>
        )}
      </div>
    </main>
  );
}
