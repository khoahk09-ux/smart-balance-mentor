import { supabase } from "@/integrations/supabase/client";

const DASHBOARD_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-api`;

async function callDashboardApi(endpoint: string, params?: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const url = new URL(`${DASHBOARD_API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const dashboardApi = {
  // Lấy lịch học hôm nay
  getTodaySchedule: () => callDashboardApi('/schedule/today'),

  // Lấy môn điểm thấp
  getLowScores: (grade?: string, semester?: string) => 
    callDashboardApi('/scores/low', {
      ...(grade && { grade }),
      ...(semester && { semester })
    }),

  // Đếm số thành tích
  getAchievementsCount: () => callDashboardApi('/achievements/count'),

  // Lấy điểm trung bình
  getAverageScore: (grade?: string, semester?: string) => 
    callDashboardApi('/scores/avg', {
      ...(grade && { grade }),
      ...(semester && { semester })
    }),
};
