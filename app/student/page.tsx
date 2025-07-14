"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
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
  const [eligibleCompanies, setEligibleCompanies] = useState<EligibleCompany[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const fetchEligibilityByEmail = async (email: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "submissions"),
        where("email", "==", email)
      );
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
      } else {
        setEligibleCompanies([]);
      }
    } catch (err) {
      console.error("Error fetching eligibility:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubmittedEmail(emailInput.trim());
    fetchEligibilityByEmail(emailInput.trim());
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          Interview Eligibility
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4"
        >
          <input
            type="email"
            placeholder="Enter your email to check eligibility"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Check Eligibility
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500">Checking eligibility...</p>
        ) : submittedEmail ? (
          eligibleCompanies.length > 0 ? (
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
          )
        ) : null}
      </div>
    </main>
  );
}
