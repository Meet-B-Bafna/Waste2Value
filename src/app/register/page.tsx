"use client";

import React, { useState } from "react";
import { ClockLoader } from "react-spinners";
import axios from "axios";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Recycle,
  UserRound,
  Mail,
  MapPin,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { stateandcity } from "@/assets/StateList";
import { Error } from "@/types/ErrorTypes";
import Toast from "@/utils/toast";

const Page = () => {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedState, setSelectedState] = useState("Select State");
  const [citySelected, setCitySelected] = useState("select city");
  const [cities, setCities] = useState<string[]>(
    stateandcity["Select State"]
  );

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const passwordValid = password.length >= 8;

  const formValid =
    userName.trim() !== "" &&
    email.trim() !== "" &&
    selectedState !== "Select State" &&
    citySelected !== "select city" &&
    passwordValid &&
    password === confirmPassword;

  const handleStateChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const state = event.target.value;

    setSelectedState(state);

    const stateCities =
      stateandcity[state as keyof typeof stateandcity] || [];

    setCities(stateCities);
    setCitySelected(stateCities[0] || "select city");
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!userName.trim()) {
      return Toast.ErrorShowToast("Please enter your username");
    }

    if (!email.trim()) {
      return Toast.ErrorShowToast("Please enter your email");
    }

    if (selectedState === "Select State") {
      return Toast.ErrorShowToast("Please select your state");
    }

    if (!citySelected || citySelected === "select city") {
      return Toast.ErrorShowToast("Please select your city");
    }

    if (password.length < 8) {
      return Toast.ErrorShowToast(
        "Password should have at least 8 characters"
      );
    }

    if (password !== confirmPassword) {
      return Toast.ErrorShowToast("Passwords didn't match");
    }

    try {
      setLoading(true);

      const UserData = {
        username: userName.trim(),
        email: email.trim(),
        password,
        state: selectedState,
        city: citySelected,
      };

      const res = await axios.post("/api/auth/register", UserData);

      if (res?.data?.verified) {
        Toast.SuccessshowToast("Account created! You can log in now.");
      } else {
        Toast.SuccessshowToast(
          `Email sent to ${email}, please verify`
        );
      }

      router.push("/login");
    } catch (error: unknown) {
      const apiError = error as Error;

      console.error("Registration error:", apiError);

      Toast.ErrorShowToast(
        apiError?.response?.data?.error || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  const fieldClass =
    "flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 transition-all duration-200 focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-600/10";

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-gray-600 transition hover:bg-green-100 hover:text-green-800"
        >
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        <section className="mx-auto mt-5 grid max-w-5xl overflow-hidden rounded-3xl border border-green-100 bg-white shadow-xl shadow-green-900/5 lg:grid-cols-2">
          {/* Left branding panel */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 p-10 text-white lg:flex">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute right-10 top-1/2 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Recycle size={29} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Waste2Value
                  </h1>
                  <p className="text-xs text-green-100">
                    Smart waste. Sustainable future.
                  </p>
                </div>
              </div>

              <div className="mt-20">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
                  Join the movement
                </span>

                <h2 className="mt-7 text-4xl font-bold leading-tight">
                  Small actions.
                  <br />
                  Greener tomorrow.
                </h2>

                <p className="mt-5 max-w-sm text-base leading-7 text-green-100">
                  Start your sustainability journey. Make smarter
                  waste choices and turn everyday actions into positive
                  environmental impact.
                </p>
              </div>
            </div>

            <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 size={21} />
                </div>
                <div>
                  <p className="font-semibold">Create your account</p>
                  <p className="mt-1 text-sm text-green-100">
                    One step towards a cleaner planet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration form */}
          <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-12">
            {/* Mobile branding */}
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <Recycle size={25} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Waste2Value
                </h1>
                <p className="text-xs text-gray-500">
                  Smart waste. Sustainable future.
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                Get started
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Create your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Fill in your details to join the Waste2Value community.
              </p>
            </div>

            <form
              autoComplete="on"
              className="flex flex-col gap-5"
              onSubmit={handleRegister}
            >
              {/* Username */}
              <div>
                <label htmlFor="username" className={labelClass}>
                  Username
                </label>

                <div className={fieldClass}>
                  <UserRound
                    size={19}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>

                <div className={fieldClass}>
                  <Mail
                    size={19}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* State and city */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="state" className={labelClass}>
                    State
                  </label>

                  <div className={fieldClass}>
                    <MapPin
                      size={18}
                      className="shrink-0 text-gray-400"
                    />

                    <select
                      id="state"
                      name="state"
                      value={selectedState}
                      onChange={handleStateChange}
                      className={`${inputClass} cursor-pointer`}
                      required
                    >
                      {Object.keys(stateandcity).map((state) => (
                        <option value={state} key={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className={labelClass}>
                    City
                  </label>

                  <div className={fieldClass}>
                    <MapPin
                      size={18}
                      className="shrink-0 text-gray-400"
                    />

                    <select
                      id="city"
                      name="city"
                      value={citySelected}
                      onChange={(e) => setCitySelected(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                      required
                    >
                      {cities.map((city, index) => (
                        <option value={city} key={`${city}-${index}`}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>

                <div className={fieldClass}>
                  <LockKeyhole
                    size={19}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="shrink-0 text-gray-400 transition hover:text-green-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                {password.length > 0 && (
                  <p
                    className={`mt-2 text-xs ${
                      passwordValid ? "text-green-700" : "text-red-500"
                    }`}
                  >
                    {passwordValid
                      ? "Password length requirement satisfied."
                      : "Password must contain at least 8 characters."}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={labelClass}
                >
                  Confirm password
                </label>

                <div
                  className={`flex items-center gap-3 rounded-xl border bg-white px-4 transition-all duration-200 focus-within:ring-4 ${
                    passwordMismatch
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-gray-200 focus-within:border-green-600 focus-within:ring-green-600/10"
                  }`}
                >
                  <LockKeyhole
                    size={19}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="shrink-0 text-gray-400 transition hover:text-green-700"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                {passwordMismatch && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Register button */}
              <button
                type="submit"
                disabled={!formValid || loading}
                className={`mt-1 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-200 ${
                  formValid && !loading
                    ? "bg-green-700 shadow-lg shadow-green-700/20 hover:-translate-y-0.5 hover:bg-green-800"
                    : "cursor-not-allowed bg-gray-300"
                }`}
              >
                {loading ? (
                  <>
                    <ClockLoader size={21} color="#ffffff" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowLeft className="rotate-180" size={18} />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-green-700 transition hover:text-green-900"
                >
                  Login
                </Link>
              </p>
            </form>

            <div className="mt-7 flex items-start gap-2 rounded-xl bg-green-50 p-3">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-green-700"
              />

              <p className="text-xs leading-5 text-gray-600">
                After registration, check your email for verification
                instructions if verification is required.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          Waste2Value · Building a more sustainable future
        </p>
      </div>
    </main>
  );
};

export default Page;