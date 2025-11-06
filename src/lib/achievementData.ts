export type AchievementCategory = 
  | "startup" 
  | "learning" 
  | "memory" 
  | "test" 
  | "streak" 
  | "community" 
  | "fun";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  target: number;
  tier?: number;
}

export const achievementCategories = {
  startup: {
    title: "🚀 Thành Tích Khởi Động",
    subtitle: "(dễ - tạo cảm giác thành công sớm)",
    color: "from-yellow-500 to-orange-500"
  },
  learning: {
    title: "📘 Thành Tích Học Bài",
    subtitle: "(gắn với tiến trình học)",
    color: "from-blue-500 to-cyan-500"
  },
  memory: {
    title: "🧠 Thành Tích Trí Nhớ & Flashcard",
    subtitle: "",
    color: "from-pink-500 to-rose-500"
  },
  test: {
    title: "📝 Thành Tích Làm Bài Test",
    subtitle: "",
    color: "from-purple-500 to-indigo-500"
  },
  streak: {
    title: "🔥 Thành Tích Duy Trì Thói Quen (Streak)",
    subtitle: "",
    color: "from-orange-500 to-red-500"
  },
  community: {
    title: "💬 Thành Tích Tương Tác - Cộng Đồng",
    subtitle: "(nếu app có diễn đàn hoặc bình luận)",
    color: "from-green-500 to-emerald-500"
  },
  fun: {
    title: "🎉 Thành Tích Vui - Tạo Hứng Thú",
    subtitle: "",
    color: "from-violet-500 to-purple-500"
  }
};

export const achievements: Achievement[] = [
  // Thành Tích Khởi Động
  {
    id: "first_login",
    category: "startup",
    name: "Tập làm quen",
    description: "Mở app 3 lần trong ngày đầu tiên",
    icon: "👋",
    target: 3
  },
  {
    id: "complete_tour",
    category: "startup",
    name: "Dạo một vòng",
    description: "Xem qua 10 bài học bất kỳ",
    icon: "📚",
    target: 10
  },
  {
    id: "first_review",
    category: "startup",
    name: "Bắt đầu ôn tập",
    description: "Ôn lại ít nhất 1 bài học",
    icon: "📖",
    target: 1
  },
  {
    id: "first_quiz",
    category: "startup",
    name: "Thử sức xem sao",
    description: "Làm thử 1 bài quiz 5 câu",
    icon: "🎯",
    target: 1
  },
  {
    id: "set_goal",
    category: "startup",
    name: "Đặt mục tiêu",
    description: "Thiết lập mục tiêu học tập trong app",
    icon: "🎯",
    target: 1
  },
  
  // Thành Tích Học Bài
  {
    id: "diligent_student",
    category: "learning",
    name: "Chăm chỉ tích lũy",
    description: "Hoàn thành 20 bài học",
    icon: "✍️",
    target: 20
  },
  {
    id: "weekly_warrior",
    category: "learning",
    name: "Bao quát toàn chương",
    description: "Hoàn thành 1 chủ đề đầy đủ",
    icon: "📦",
    target: 1
  },
  {
    id: "diverse_learner",
    category: "learning",
    name: "Học rộng biết nhiều",
    description: "Học qua 5 chuyên mục khác nhau",
    icon: "🌊",
    target: 5
  },
  {
    id: "consistent_practice",
    category: "learning",
    name: "Luyện mãi thành tài",
    description: "Xem lại cùng 1 bài học 3 lần",
    icon: "🎄",
    target: 3
  },
  {
    id: "perfect_day",
    category: "learning",
    name: "Không bỏ sót kiến thức",
    description: "Hoàn thành 100% mục ôn tập ngày",
    icon: "✅",
    target: 1
  },
  
  // Thành Tích Trí Nhớ & Flashcard
  {
    id: "flashcard_beginner",
    category: "memory",
    name: "Tân binh Flashcard",
    description: "Ôn 10 thẻ flashcard",
    icon: "🎴",
    target: 10
  },
  {
    id: "flashcard_intermediate",
    category: "memory",
    name: "Ghi nhớ dần dần",
    description: "Ôn 50 thẻ flashcard",
    icon: "🧩",
    target: 50
  },
  {
    id: "flashcard_master",
    category: "memory",
    name: "Bộ nhớ siêu tốc",
    description: "Ôn 100 thẻ flashcard",
    icon: "🎓",
    target: 100
  },
  {
    id: "memory_champion",
    category: "memory",
    name: "Nhớ đến thuộc lòng",
    description: "Ôn 1 thẻ > 5 lần liên tục",
    icon: "📋",
    target: 1
  },
  {
    id: "accuracy_master",
    category: "memory",
    name: "Cài đặt bộ não thép",
    description: "Tỷ lệ nhớ flashcard > 80% trong 1 ngày",
    icon: "🧠",
    target: 1
  },
  
  // Thành Tích Làm Bài Test
  {
    id: "first_perfect_score",
    category: "test",
    name: "Bản phát trúng luôn",
    description: "Đạt điểm cao trong bài test đầu tiên",
    icon: "🎖️",
    target: 1
  },
  {
    id: "consistent_high_scores",
    category: "test",
    name: "Ổn áp rồi đó!",
    description: "Đạt ≥ 8 điểm trong 5 bài test liên tiếp",
    icon: "🔥",
    target: 5
  },
  {
    id: "mistake_learner",
    category: "test",
    name: "Không ngại sửa sai",
    description: "Làm test xong xem lại toàn bộ lời giải",
    icon: "🔍",
    target: 1
  },
  {
    id: "retry_champion",
    category: "test",
    name: "Phục thù thành công",
    description: "Làm lại bài test cũ và tăng điểm",
    icon: "🏆",
    target: 1
  },
  {
    id: "speed_master",
    category: "test",
    name: "Tốc độ phản xạ",
    description: "Trả lời mỗi câu trong < 8 giây trung bình",
    icon: "⏱️",
    target: 1
  },
  
  // Thành Tích Duy Trì Thói Quen (Streak)
  {
    id: "streak_3_days",
    category: "streak",
    name: "Ngày thứ 3 tuyệt vời",
    description: "Học 3 ngày liên tiếp",
    icon: "🌱",
    target: 3
  },
  {
    id: "streak_7_days",
    category: "streak",
    name: "Thói quen hình thành",
    description: "Học 7 ngày liên tiếp",
    icon: "📅",
    target: 7
  },
  {
    id: "streak_15_days",
    category: "streak",
    name: "Bước vào quỹ đạo",
    description: "Học 15 ngày liên tiếp",
    icon: "🍌",
    target: 15
  },
  {
    id: "streak_30_days",
    category: "streak",
    name: "Thép đã tôi thế đây",
    description: "Học 30 ngày liên tiếp",
    icon: "🏗️",
    target: 30
  },
  {
    id: "streak_100_days",
    category: "streak",
    name: "Học là hơi thở",
    description: "Học 100 ngày liên tiếp",
    icon: "💎",
    target: 100
  },
  
  // Thành Tích Tương Tác - Cộng Đồng
  {
    id: "community_engaged",
    category: "community",
    name: "Giao lưu cực vui",
    description: "Đăng bình luận đầu tiên",
    icon: "💬",
    target: 1
  },
  {
    id: "community_helper",
    category: "community",
    name: "Hỗ trợ người khác",
    description: "Trả lời câu hỏi ai đó",
    icon: "💛",
    target: 1
  },
  {
    id: "community_popular",
    category: "community",
    name: "Giáo viên trong tương lai",
    description: "Câu trả lời được 10 lượt thích",
    icon: "🏆",
    target: 10
  },
  {
    id: "community_share",
    category: "community",
    name: "Truyền lửa học tập",
    description: "Chia sẻ bài học lên mạng xã hội",
    icon: "🔗",
    target: 1
  },
  {
    id: "community_invite",
    category: "community",
    name: "Bạn học đồng hành",
    description: "Mời thêm 1 người dùng mới",
    icon: "👥",
    target: 1
  },
  
  // Thành Tích Vui - Tạo Hứng Thú
  {
    id: "fun_avatar",
    category: "fun",
    name: "Đổi avatar cho xịn",
    description: "Thay ảnh đại diện",
    icon: "🖼️",
    target: 1
  },
  {
    id: "fun_theme",
    category: "fun",
    name: "Trang trí góc học tập",
    description: "Đổi giao diện / chủ đề app",
    icon: "🎨",
    target: 1
  },
  {
    id: "fun_upgrade",
    category: "fun",
    name: "Nâng cấp bản thân",
    description: "Tăng cấp độ tài khoản lần đầu",
    icon: "📊",
    target: 1
  },
  {
    id: "fun_app_lover",
    category: "fun",
    name: "Tôi thích học thật mà!",
    description: "Dùng app > 30 phút trong 1 ngày",
    icon: "❤️",
    target: 1
  },
  {
    id: "fun_try_harder",
    category: "fun",
    name: "Tuy không giỏi nhưng có cố gắng",
    description: "Học lại bài 3 lần trở lên",
    icon: "📱",
    target: 3
  }
];
