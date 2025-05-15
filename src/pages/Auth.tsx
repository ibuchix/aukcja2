
import { useLocation } from "react-router-dom";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { AuthErrorState } from "@/components/auth/AuthErrorState";
import { InitializingState } from "@/components/auth/InitializingState";
import { useAuthStateCheck } from "@/components/auth/useAuthStateCheck";

const Auth = () => {
  const location = useLocation();
  const returnUrl = location.state?.returnUrl || "/dealer/dashboard";
  
  const {
    authError,
    isLoading,
    isInitialized,
    authCheckDelay,
    loadingTimeout,
    forceShowLogin,
    forceLoginFormDisplay
  } = useAuthStateCheck(returnUrl);

  // Show pre-initialization loading state
  if (!isInitialized && authCheckDelay) {
    return <InitializingState />;
  }

  // Show loading indicator during the initial authentication check
  if ((isLoading || authCheckDelay) && !forceShowLogin) {
    return <AuthLoadingState isLoadingTimeout={loadingTimeout} forceShowLogin={forceLoginFormDisplay} />;
  }

  if (authError) {
    return <AuthErrorState />;
  }

  return (
    <AuthContainer>
      <AuthTabs returnUrl={returnUrl} />
    </AuthContainer>
  );
};

export default Auth;
