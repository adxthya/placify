"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cgpa: "",
    stream: "",
    srNumber: "",
    universityNumber: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setFormData((prev) => ({
          ...prev,
          name: currentUser.displayName || "",
          email: currentUser.email || "",
        }));
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "submissions"), {
        ...formData,
        cgpa: parseFloat(formData.cgpa),
        uid: user.uid,
        timestamp: Timestamp.now(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-blue-800 mb-2">
          Placify
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Fill in your details to be considered for placement.
        </p>

        {submitted ? (
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <p className="text-green-600 text-lg font-semibold mb-2">
              ✅ Submission successful!
            </p>
            <p className="text-gray-700">
              We&apos;ll contact you if you&apos;re shortlisted.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow space-y-5"
          >
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email ID"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="text"
              name="srNumber"
              placeholder="SR Number"
              value={formData.srNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="text"
              name="universityNumber"
              placeholder="University Number"
              value={formData.universityNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="number"
              name="cgpa"
              placeholder="CGPA"
              value={formData.cgpa}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Stream</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Submit Details
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
