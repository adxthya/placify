"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Timestamp as FBTimestamp } from "firebase/firestore";

interface Submission {
  id: string;
  name: string;
  email: string;
  cgpa: number;
  stream: string;
  srNumber: string;
  universityNumber: string;
  timestamp: FBTimestamp;
  eligibility?: Record<
    string,
    {
      eligible: boolean;
      date?: string;
    }
  >;
}

export default function CompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        await fetchSubmissions();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSubmissions = async () => {
    try {
      const q = query(
        collection(db, "submissions"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Collect all company names
  const allCompanies = new Set<string>();
  submissions.forEach((s) => {
    const keys = Object.keys(s.eligibility || {});
    keys.forEach((k) => allCompanies.add(k));
  });

  return (
    <main className="min-h-screen bg-gray-100 flex">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Company-wise Eligibility
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          [...allCompanies].map((companyKey) => (
            <div
              key={companyKey}
              className="mb-10 bg-white rounded shadow p-6"
            >
              <h2 className="text-xl font-semibold mb-4 capitalize text-blue-700">
                {companyKey.replace(/_/g, " ")}
              </h2>
              <div className="overflow-auto">
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">CGPA</th>
                      <th className="px-3 py-2 text-left">Stream</th>
                      <th className="px-3 py-2 text-left">Interview Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .filter((s) => s.eligibility?.[companyKey]?.eligible)
                      .map((s) => (
                        <tr
                          key={s.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-3 py-2">{s.name}</td>
                          <td className="px-3 py-2">{s.email}</td>
                          <td className="px-3 py-2">{s.cgpa}</td>
                          <td className="px-3 py-2">{s.stream}</td>
                          <td className="px-3 py-2">
                            {s.eligibility?.[companyKey]?.date || "—"}
                          </td>
                        </tr>
                      ))}
                    {submissions.filter(
                      (s) => s.eligibility?.[companyKey]?.eligible
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center text-gray-500 py-4"
                        >
                          No eligible students
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
