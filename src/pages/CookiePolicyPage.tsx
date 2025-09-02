import { DashboardLayout } from '@/components/dealer/dashboard/DashboardLayout';
import { CookiePolicy } from '@/components/cookies/CookiePolicy';

const CookiePolicyPage = () => {
  return (
    <DashboardLayout title="Polityka plików cookie">
      <CookiePolicy />
    </DashboardLayout>
  );
};

export default CookiePolicyPage;