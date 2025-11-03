import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SUBJECTS = [
  'Toán',
  'Ngữ Văn',
  'Tiếng Anh',
  'Vật Lý',
  'Hóa Học',
  'Sinh Học',
  'Lịch Sử',
  'Địa Lý',
  'GDCD',
];

const SubjectSelection = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasExistingSubjects, setHasExistingSubjects] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user already has specialized subjects
    const checkExistingSubjects = async () => {
      const { data, error } = await supabase
        .from('specialized_subjects')
        .select('subject')
        .eq('user_id', user.id);

      if (!error && data && data.length > 0) {
        setHasExistingSubjects(true);
        setSelectedSubjects(data.map(s => s.subject));
      }
    };

    checkExistingSubjects();
  }, [user, navigate]);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        if (prev.length >= 3) {
          toast({
            variant: 'destructive',
            title: 'Giới hạn 3 môn',
            description: 'Bạn chỉ có thể chọn tối đa 3 môn chuyên.',
          });
          return prev;
        }
        return [...prev, subject];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length !== 3) {
      toast({
        variant: 'destructive',
        title: 'Chưa đủ môn',
        description: 'Vui lòng chọn đúng 3 môn chuyên.',
      });
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error('Không tìm thấy người dùng');

      // Delete existing subjects if updating
      if (hasExistingSubjects) {
        await supabase
          .from('specialized_subjects')
          .delete()
          .eq('user_id', user.id);
      }

      // Insert new subjects
      const { error } = await supabase
        .from('specialized_subjects')
        .insert(
          selectedSubjects.map(subject => ({
            user_id: user.id,
            subject,
          }))
        );

      if (error) throw error;

      toast({
        title: 'Thành công!',
        description: `Đã ${hasExistingSubjects ? 'cập nhật' : 'lưu'} 3 môn chuyên của bạn.`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.message || 'Không thể lưu môn chuyên. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {hasExistingSubjects ? 'Cập nhật môn chuyên' : 'Chọn 3 môn chuyên'}
            </CardTitle>
            <CardDescription>
              Các môn chuyên sẽ được ưu tiên với bài tập nâng cao hơn
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);
              return (
                <div
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                      className="pointer-events-none"
                    />
                    <span className="font-medium">{subject}</span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-primary" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Đã chọn: {selectedSubjects.length}/3 môn
          </div>

          <div className="flex gap-3">
            {hasExistingSubjects && (
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Hủy
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedSubjects.length !== 3}
              className="flex-1"
            >
              {loading ? 'Đang lưu...' : (hasExistingSubjects ? 'Cập nhật' : 'Hoàn thành')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectSelection;
