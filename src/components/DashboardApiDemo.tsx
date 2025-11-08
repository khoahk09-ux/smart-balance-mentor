import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Loader2 } from 'lucide-react';
import { dashboardApi } from '@/lib/dashboardApi';
import { toast } from 'sonner';

export const DashboardApiDemo = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(name);
    try {
      const result = await apiCall();
      setResults(prev => ({ ...prev, [name]: result }));
      toast.success(`API ${name} thành công!`);
    } catch (error) {
      toast.error(`Lỗi khi gọi API ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const endpoints = [
    {
      name: 'schedule/today',
      description: 'Lấy lịch học hôm nay',
      action: () => testEndpoint('schedule/today', dashboardApi.getTodaySchedule),
      path: 'GET /functions/v1/dashboard-api/schedule/today',
    },
    {
      name: 'scores/low',
      description: 'Lấy môn điểm thấp (< 6.5)',
      action: () => testEndpoint('scores/low', () => dashboardApi.getLowScores('10', 'Kỳ 1')),
      path: 'GET /functions/v1/dashboard-api/scores/low?grade=10&semester=Kỳ 1',
    },
    {
      name: 'achievements/count',
      description: 'Đếm số thành tích',
      action: () => testEndpoint('achievements/count', dashboardApi.getAchievementsCount),
      path: 'GET /functions/v1/dashboard-api/achievements/count',
    },
    {
      name: 'scores/avg',
      description: 'Tính điểm trung bình',
      action: () => testEndpoint('scores/avg', () => dashboardApi.getAverageScore('10', 'Kỳ 1')),
      path: 'GET /functions/v1/dashboard-api/scores/avg?grade=10&semester=Kỳ 1',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Dashboard API Demo
          </CardTitle>
          <CardDescription>
            Test các endpoint của Dashboard API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpoints.map((endpoint) => (
            <div key={endpoint.name} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {endpoint.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </span>
                  </div>
                  <code className="text-xs text-muted-foreground block mt-2">
                    {endpoint.path}
                  </code>
                </div>
                <Button
                  size="sm"
                  onClick={endpoint.action}
                  disabled={loading === endpoint.name}
                >
                  {loading === endpoint.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gọi...
                    </>
                  ) : (
                    'Test API'
                  )}
                </Button>
              </div>
              
              {results[endpoint.name] && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-xs font-semibold mb-2">Kết quả:</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(results[endpoint.name], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cách sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Import API helper:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { dashboardApi } from '@/lib/dashboardApi';`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Gọi API:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`// Lịch học hôm nay
const todaySchedule = await dashboardApi.getTodaySchedule();

// Môn điểm thấp
const lowScores = await dashboardApi.getLowScores('10', 'Kỳ 1');

// Số thành tích
const achievementsCount = await dashboardApi.getAchievementsCount();

// Điểm trung bình
const averageScore = await dashboardApi.getAverageScore('10', 'Kỳ 1');`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Gọi trực tiếp (fetch):</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`const { data: { session } } = await supabase.auth.getSession();
const url = \`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-api/schedule/today\`;

const response = await fetch(url, {
  headers: {
    'Authorization': \`Bearer \${session.access_token}\`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
