'use client';

import { useUser, SignIn } from '@clerk/nextjs';
import TaskManager from '@/components/TaskManager';

export default function Page() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="auth-loading">Loading…</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <img src="/logo.svg" alt="" className="auth-icon" />
          <h1 className="auth-name">Progress Tracker</h1>
          <p className="tagline">Track client escalations from intake to resolution</p>
        </div>
        <SignIn routing="hash" />
      </div>
    );
  }

  return <TaskManager />;
}
