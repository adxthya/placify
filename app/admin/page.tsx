"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
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

interface ExportRow {
  [key: string]: string | number | null | undefined;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [minCgpa, setMinCgpa] = useState(0);
  const [stream, setStream] = useState("");

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
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const meetsCgpa = s.cgpa >= minCgpa;
    const matchesStream = stream ? s.stream === stream : true;
    return meetsCgpa && matchesStream;
  });

  const markEligible = async (id: string) => {
    if (!companyName.trim()) {
      alert("Enter a company name first.");
      return;
    }

    const companyKey = companyName.toLowerCase().replace(/\s+/g, "_");
    const studentRef = doc(db, "submissions", id);

    try {
      await updateDoc(studentRef, {
        [`eligibility.${companyKey}`]: {
          eligible: true,
          date: interviewDate || "",
        },
      });
      await fetchSubmissions();
    } catch (err) {
      console.error("Error updating eligibility:", err);
    }
  };

  const removeEligibility = async (id: string) => {
    if (!companyName.trim()) {
      alert("Enter a company name first.");
      return;
    }

    const companyKey = companyName.toLowerCase().replace(/\s+/g, "_");
    const studentRef = doc(db, "submissions", id);

    try {
      await updateDoc(studentRef, {
        [`eligibility.${companyKey}`]: {
          eligible: false,
          date: "",
        },
      });
      await fetchSubmissions();
    } catch (err) {
      console.error("Error removing eligibility:", err);
    }
  };

  const deleteSubmission = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this submission?"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "submissions", id));
      await fetchSubmissions();
    } catch (err) {
      console.error("Error deleting submission:", err);
      alert("Failed to delete submission.");
    }
  };

  const exportToCSV = (data: ExportRow[], filename: string) => {
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) => `"${v ?? ""}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadEligibleCSV = () => {
    if (!companyName.trim()) {
      alert("Enter a company name first.");
      return;
    }

    const companyKey = companyName.toLowerCase().replace(/\s+/g, "_");

    const eligibleData = filtered
      .filter((s) => s.eligibility?.[companyKey]?.eligible)
      .map((s) => ({
        Name: s.name,
        Email: s.email,
        "SR Number": s.srNumber,
        "University Number": s.universityNumber,
        CGPA: s.cgpa,
        Stream: s.stream,
        "Interview Date": s.eligibility?.[companyKey]?.date || "",
      }));

    if (eligibleData.length === 0) {
      alert("No eligible students found for export.");
      return;
    }

    exportToCSV(eligibleData, `${companyKey}_eligible.csv`);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 sm:px-8">
      <h1 className="text-4xl font-medium text-center mb-10 text-gray-800">
        Admin Dashboard
      </h1>

      <section className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Company Criteria
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Minimum CGPA"
            value={minCgpa}
            onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Stream</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <button
            onClick={downloadEligibleCSV}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            📥 Download Eligible CSV
          </button>
        </div>
      </section>

      {loading ? (
        <p className="text-center text-gray-600">Loading submissions...</p>
      ) : (
        <section className="bg-white p-6 rounded-xl shadow-md max-w-6xl mx-auto overflow-auto">
          <table className="w-full text-sm text-left border border-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-gray-700">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">SR No</th>
                <th className="px-3 py-2">Univ No</th>
                <th className="px-3 py-2">CGPA</th>
                <th className="px-3 py-2">Stream</th>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">Eligible?</th>
                <th className="px-3 py-2">Interview Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const companyKey = companyName
                  .toLowerCase()
                  .replace(/\s+/g, "_");
                const isEligible = s.eligibility?.[companyKey]?.eligible;
                const date = s.eligibility?.[companyKey]?.date || "";

                return (
                  <tr
                    key={s.id}
                    className={`border-b ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.email}</td>
                    <td className="px-3 py-2">{s.srNumber}</td>
                    <td className="px-3 py-2">{s.universityNumber}</td>
                    <td className="px-3 py-2">{s.cgpa}</td>
                    <td className="px-3 py-2">{s.stream}</td>
                    <td className="px-3 py-2">
                      {s.timestamp?.toDate?.().toLocaleString() || "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isEligible ? "✅" : "❌"}
                    </td>
                    <td className="px-3 py-2">{date}</td>
                    <td className="px-3 py-2 space-y-2 flex flex-col w-[170px]">
                      <button
                        onClick={() => markEligible(s.id)}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Mark Eligible
                      </button>
                      <button
                        onClick={() => removeEligibility(s.id)}
                        className="bg-yellow-500 text-white px-1 py-1 rounded hover:bg-yellow-600"
                      >
                        Remove Eligiblity
                      </button>
                      <button
                        onClick={() => deleteSubmission(s.id)}
                        className="bg-red-600 text-white px-1 py-1 rounded hover:bg-red-700"
                      >
                        Delete Submission
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-4 text-gray-500"
                  >
                    No students match the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
