import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC<{ adminPortal?: boolean }> = ({ adminPortal }) => (
  <div className="min-h-screen bg-[#ebedf0] flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-7 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
        <Lock className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-[#292933]">401 · Authentication Required</h1>
      <p className="text-xs text-gray-600 leading-relaxed">
        You must sign in with an active verified session to access this area.
      </p>
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <Link
          to={adminPortal ? '/admin/login' : '/login'}
          className="px-4 py-2 rounded-lg bg-[#ff4300] hover:bg-[#d93800] text-white text-xs font-bold"
        >
          Go to Sign In
        </Link>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </Link>
      </div>
    </div>
  </div>
);

export const ForbiddenPage: React.FC<{ reason?: string }> = ({ reason }) => (
  <div className="min-h-screen bg-[#ebedf0] flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-7 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-[#292933]">403 · Access Forbidden</h1>
      <p className="text-xs text-gray-600 leading-relaxed">
        {reason || 'Your account does not hold the required RBAC role or permission to access this module.'}
      </p>
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-[#292933] hover:bg-[#1b1b28] text-white text-xs font-bold inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
      </div>
    </div>
  </div>
);

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ebedf0] text-xs font-semibold text-gray-600">
        Verifying secure session...
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
};

export const RequireAdmin: React.FC<{
  requiredPermission?: string;
  children: React.ReactNode;
}> = ({ requiredPermission, children }) => {
  const { currentUser, isLoading, isManager, isAdminSession, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] text-xs font-semibold text-gray-600">
        Verifying administrator session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (!isManager || !isAdminSession) {
    return (
      <ForbiddenPage reason="Access restricted. Customers and non-admin sessions cannot open the administrative workspace." />
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <ForbiddenPage reason={`Missing required permission (${requiredPermission}). Contact your Super Administrator.`} />
    );
  }

  return <>{children}</>;
};
