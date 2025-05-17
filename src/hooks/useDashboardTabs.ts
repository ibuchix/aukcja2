
import { useEffect } from 'react';

/**
 * Hook to handle dashboard tab synchronization
 * between different components
 */
export const useDashboardTabs = (
  activeTab: string,
  setActiveTab: (tab: string) => void
) => {
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
    };

    // Add event listener for tab change events
    window.addEventListener('set-dashboard-tab', handleTabChange);
    
    // Clean up
    return () => {
      window.removeEventListener('set-dashboard-tab', handleTabChange);
    };
  }, [setActiveTab]);

  return {
    activeTab,
    setActiveTab
  };
};
