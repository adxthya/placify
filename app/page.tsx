"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
  doc,
} from "firebase/firestore";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cgpa: "",
    stream: "",
    srNumber: "",
    universityNumber: "",
  });

  useEffect(() => {
    const checkExisting = async () => {
      if (!formData.email) return;
      const q = query(
        collection(db, "submissions"),
        where("email", "==", formData.email)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setExistingDocId(snapshot.docs[0].id);
        setFormData({
          name: docData.name || "",
          email: docData.email || "",
          cgpa: docData.cgpa?.toString() || "",
          stream: docData.stream || "",
          srNumber: docData.srNumber || "",
          universityNumber: docData.universityNumber || "",
        });
        setSubmitted(true);
      }
    };

    checkExisting();
  }, [formData.email]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const submission = {
      ...formData,
      cgpa: parseFloat(formData.cgpa),
      timestamp: Timestamp.now(),
    };

    try {
      if (existingDocId) {
        const ref = doc(db, "submissions", existingDocId);
        await updateDoc(ref, submission);
      } else {
        await addDoc(collection(db, "submissions"), submission);
      }

      setSubmitted(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-medium text-center mb-4">Placify</h1>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center">
            ✅ Submission successful!
          </div>
        )}

        <p className="text-gray-600 text-center mb-6">
          {submitted
            ? "You have already submitted your details. You can update them here."
            : "Fill in your details to be considered for placement."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-md w-full space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="text"
            name="srNumber"
            placeholder="SR Number"
            value={formData.srNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="text"
            name="universityNumber"
            placeholder="University Number"
            value={formData.universityNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="number"
            name="cgpa"
            placeholder="CGPA"
            value={formData.cgpa}
            onChange={handleChange}
            step="0.01"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <select
            name="stream"
            value={formData.stream}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
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
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            {existingDocId ? "Update Details" : "Submit Details"}
          </button>
        </form>
      </div>
    </main>
  );
}
