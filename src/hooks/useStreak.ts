import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useStreak = () => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching streak:", error);
        return;
      }

      if (data) {
        setCurrentStreak(data.current_streak);
        setLongestStreak(data.longest_streak);

        // Check if user can check in today
        const today = new Date().toISOString().split("T")[0];
        const lastCheckIn = data.last_check_in
          ? new Date(data.last_check_in).toISOString().split("T")[0]
          : null;

        setCanCheckIn(today !== lastCheckIn);
      } else {
        // Create new streak record
        const { error: insertError } = await supabase
          .from("user_streaks")
          .insert({
            user_id: user.id,
            current_streak: 0,
            longest_streak: 0,
          });

        if (insertError) {
          console.error("Error creating streak:", insertError);
        }
        setCanCheckIn(true);
      }
    } catch (error) {
      console.error("Error in fetchStreak:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    if (!user || !canCheckIn) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Get current streak data
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let newStreak = 1;
      if (streakData) {
        const lastCheckIn = streakData.last_check_in
          ? new Date(streakData.last_check_in).toISOString().split("T")[0]
          : null;

        // If last check-in was yesterday, increment streak
        if (lastCheckIn === yesterday) {
          newStreak = streakData.current_streak + 1;
        }
      }

      const newLongest = Math.max(newStreak, longestStreak);

      // Update streak
      const { error: updateError } = await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_check_in: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Record check-in
      const { error: checkInError } = await supabase.from("checkin").insert({
        user_id: user.id,
        ngay: today,
        trangthai: true,
      });

      if (checkInError && checkInError.code !== "23505") {
        // Ignore duplicate key error
        throw checkInError;
      }

      // Update local state
      setCurrentStreak(newStreak);
      setLongestStreak(newLongest);
      setCanCheckIn(false);

      // Show success message
      if (newStreak === newLongest && newStreak > 1) {
        toast.success(`🏆 Kỷ lục mới: ${newStreak} ngày liên tiếp!`);
      } else if (newStreak >= 7) {
        toast.success(`🔥 Streak ${newStreak} ngày! Tuyệt vời!`);
      } else {
        toast.success(`✅ Điểm danh thành công! Streak: ${newStreak} ngày`);
      }
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Không thể điểm danh. Vui lòng thử lại!");
    }
  };

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  return {
    currentStreak,
    longestStreak,
    canCheckIn,
    loading,
    checkIn,
    refresh: fetchStreak,
  };
};
