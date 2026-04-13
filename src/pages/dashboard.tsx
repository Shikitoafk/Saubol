import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Trophy, Target, Zap, BookOpen, LogOut, User } from "lucide-react";

interface UserProgress {
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  current_streak: number;
  favorite_section: string;
  recent_activity: Array<{
    question_id: string;
    section: string;
    category: string;
    difficulty: string;
    correct: boolean;
    answered_at: string;
  }>;
  daily_activity: Array<{
    date: string;
    questions_answered: number;
  }>;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndProgress = async () => {
      try {
        console.log('Dashboard: Starting auth session check...');
        
        // Get auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Dashboard: Session error:', sessionError);
          setError('Failed to get user session');
          setLoading(false);
          return;
        }
        
        if (!session) {
          console.log('Dashboard: No session found, redirecting to login');
          navigate('/login');
          return;
        }
        
        console.log('Dashboard: User session found:', session.user.email);
        setUser(session.user);

        // Fetch user progress from Supabase
        console.log('Dashboard: Fetching user progress...');
        let progressData: any[] = [];
        
        try {
          const { data: data, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .order('answered_at', { ascending: false });

          if (progressError) {
            console.error('Dashboard: Progress fetch error:', progressError);
            // Table might not exist or other error - set empty data
            progressData = [];
          } else {
            console.log('Dashboard: Progress data loaded:', data?.length || 0, 'records');
            progressData = data || [];
          }
        } catch (fetchError) {
          console.error('Dashboard: Fetch error:', fetchError);
          progressData = [];
        }

        // Calculate stats with safe defaults
        const totalQuestions = progressData?.length || 0;
        const correctAnswers = progressData?.filter(p => p.correct).length || 0;
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        // Calculate current streak (simplified)
        const streak = 0; // Default to 0 for new users

        // Get favorite section with safe default
        const sectionCounts: Record<string, number> = {};
        progressData?.forEach(p => {
          if (p.section) {
            sectionCounts[p.section] = (sectionCounts[p.section] || 0) + 1;
          }
        });
        const favoriteSection = Object.keys(sectionCounts).length > 0 
          ? Object.keys(sectionCounts).reduce((a, b) => sectionCounts[a] > sectionCounts[b] ? a : b)
          : 'None';

        // Recent activity (last 10)
        const recentActivity = progressData?.slice(0, 10).map(p => ({
          question_id: p.question_id || '',
          section: p.section || 'Unknown',
          category: p.category || 'Unknown',
          difficulty: p.difficulty || 'Unknown',
          correct: p.correct || false,
          answered_at: p.answered_at || new Date().toISOString()
        })) || [];

        // Daily activity for last 7 days
        const dailyActivity = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const questionsAnswered = progressData?.filter(p => 
            p.answered_at && p.answered_at.startsWith(dateStr)
          ).length || 0;
          dailyActivity.push({ date: dateStr, questions_answered: questionsAnswered });
        }

        const progressDataObj: UserProgress = {
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          accuracy,
          current_streak: streak,
          favorite_section: favoriteSection,
          recent_activity: recentActivity,
          daily_activity: dailyActivity
        };
        
        console.log('Dashboard: Progress calculated:', progressDataObj);
        setProgress(progressDataObj);

      } catch (error) {
        console.error('Dashboard: Unexpected error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    getUserAndProgress();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="ml-3 text-gray-600">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error loading dashboard</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}! 👋
            </h2>
            <p className="text-gray-600 mt-2">
              {progress?.total_questions === 0 
                ? 'Start practicing SAT to see your progress here' 
                : 'Here\'s your learning progress overview'
              }
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress?.total_questions || 0}</div>
                <p className="text-xs text-muted-foreground">questions answered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress?.accuracy || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {progress?.correct_answers || 0} correct out of {progress?.total_questions || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress?.current_streak || 0}</div>
                <p className="text-xs text-muted-foreground">day streak</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favorite Section</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress?.favorite_section || 'None'}</div>
                <p className="text-xs text-muted-foreground">Most practiced</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(!progress?.recent_activity || progress.recent_activity.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No recent activity. Start practicing to see your progress!</p>
                    <Button onClick={() => navigate('/sat')} className="mt-2">
                      Start Practicing →
                    </Button>
                  </div>
                ) : (
                  progress.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${activity.correct ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">{activity.section} - {activity.category}</p>
                          <p className="text-xs text-gray-500">{activity.difficulty} difficulty</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(activity.answered_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {progress?.total_questions === 0 && (
            <div className="text-center py-12 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Ready to start your SAT journey?</h3>
              <p className="text-blue-700 mb-6">Begin practicing and track your progress over time</p>
              <Button onClick={() => navigate('/sat')} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Practicing →
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Button 
              onClick={() => navigate('/sat/practice')} 
              className="flex items-center justify-between p-4 h-auto"
            >
              <span>Continue SAT Practice</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/programs')} 
              className="flex items-center justify-between p-4 h-auto"
            >
              <span>Browse Programs</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
