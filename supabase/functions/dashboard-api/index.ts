import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoresObj {
  tx1?: number;
  tx2?: number;
  tx3?: number;
  tx4?: number;
  tx5?: number;
  gk?: number;
  ck?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    console.log(`Dashboard API request: ${path}`);

    // Lịch học hôm nay
    if (path.endsWith('/schedule/today')) {
      const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      const today = new Date();
      const todayName = dayNames[today.getDay()];
      
      const { data: scheduleData, error: scheduleError } = await supabaseClient
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

      if (scheduleError) {
        throw scheduleError;
      }

      const todayClasses: any[] = [];
      
      if (scheduleData) {
        scheduleData.forEach((schedule: any) => {
          if (schedule.schedule_type === 'school') {
            const schoolData = schedule.schedule_data as Record<string, Record<string, string>>;
            if (schoolData[todayName]) {
              Object.entries(schoolData[todayName]).forEach(([period, subject]) => {
                if (subject && subject.trim()) {
                  todayClasses.push({
                    type: 'school',
                    period,
                    subject,
                    time: getPeriodTime(period)
                  });
                }
              });
            }
          } else if (schedule.schedule_type === 'extra') {
            const extraData = (schedule.schedule_data || []) as any[];
            if (Array.isArray(extraData)) {
              extraData.forEach((extraClass: any) => {
                if (extraClass.day === todayName) {
                  todayClasses.push({
                    type: 'extra',
                    subject: extraClass.subject,
                    time: extraClass.time,
                    session: extraClass.session
                  });
                }
              });
            }
          }
        });
      }

      return new Response(
        JSON.stringify({ data: todayClasses }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Môn điểm thấp
    if (path.endsWith('/scores/low')) {
      const grade = url.searchParams.get('grade') || '10';
      const semester = url.searchParams.get('semester') || 'Kỳ 1';

      const { data: scoresData, error: scoresError } = await supabaseClient
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('grade', grade)
        .eq('semester', semester);

      if (scoresError) {
        throw scoresError;
      }

      const lowSubjects = (scoresData || [])
        .map((s: any) => {
          const scoresObj = (s.scores || {}) as ScoresObj;
          const average = calculateAverage(scoresObj);
          
          return {
            id: s.id,
            subject: s.subject,
            average: average,
            scores: scoresObj,
            grade: s.grade,
            semester: s.semester
          };
        })
        .filter((s: any) => s.average > 0 && s.average < 6.5);

      return new Response(
        JSON.stringify({ data: lowSubjects }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Thành tích
    if (path.endsWith('/achievements/count')) {
      const { data: achievementsData, error: achievementsError } = await supabaseClient
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_unlocked', true);

      if (achievementsError) {
        throw achievementsError;
      }

      return new Response(
        JSON.stringify({ total: achievementsData?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Điểm trung bình
    if (path.endsWith('/scores/avg')) {
      const grade = url.searchParams.get('grade') || '10';
      const semester = url.searchParams.get('semester') || 'Kỳ 1';

      const { data: scoresData, error: scoresError } = await supabaseClient
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('grade', grade)
        .eq('semester', semester);

      if (scoresError) {
        throw scoresError;
      }

      const subjectAverages = (scoresData || [])
        .map((s: any) => {
          const scoresObj = (s.scores || {}) as ScoresObj;
          return calculateAverage(scoresObj);
        })
        .filter((avg: number) => avg > 0);

      const average = subjectAverages.length > 0
        ? subjectAverages.reduce((a: number, b: number) => a + b, 0) / subjectAverages.length
        : 0;

      return new Response(
        JSON.stringify({ 
          average: parseFloat(average.toFixed(1)),
          total_subjects: subjectAverages.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route không tìm thấy
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to calculate weighted average
function calculateAverage(scores: ScoresObj): number {
  const tx1 = scores.tx1 || 0;
  const tx2 = scores.tx2 || 0;
  const tx3 = scores.tx3 || 0;
  const tx4 = scores.tx4 || 0;
  const tx5 = scores.tx5 || 0;
  const gk = scores.gk || 0;
  const ck = scores.ck || 0;
  
  const hasScores = tx1 || tx2 || tx3 || tx4 || tx5 || gk || ck;
  
  if (!hasScores) return 0;
  
  const total = tx1 + tx2 + tx3 + tx4 + tx5 + (gk * 2) + (ck * 3);
  return parseFloat((total / 10).toFixed(1));
}

// Helper function to get period time
function getPeriodTime(period: string): string {
  const periodTimes: Record<string, string> = {
    "Tiết 1": "7:00-7:45",
    "Tiết 2": "7:50-8:35",
    "Tiết 3": "8:50-9:35",
    "Tiết 4": "9:40-10:25",
    "Tiết 5": "10:30-11:15",
    "Tiết 6": "12:45-13:30",
    "Tiết 7": "13:35-14:20",
    "Tiết 8": "14:35-15:20",
    "Tiết 9": "15:25-16:10",
    "Tiết 10": "16:15-17:00"
  };
  return periodTimes[period] || "";
}
