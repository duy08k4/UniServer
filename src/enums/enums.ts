export enum Role {
    USER = "user",
    UNIADMIN = "uniadmin",
    ROOMADMIN = "roomadmin",
    STUDENT = "student",
    LECTURER = "lecturer",
}

export enum Field_Type {
    STRING = "string",
    NUMBER = "number",
    FILE = "file",
    CHECKBOX = "checkbox",
}

export enum Unit {
  FILE = "file",
  UNIT = "unit",
  CHARACTER = "character"
}

export enum Field_Label {
  NULL = "null", // 
  OUTLINE_FILE = "outline_file", // Đề cương
  REPORT_FILE = "report_file", // Báo cáo tiến độ
  FINAL_THESIS = "final_thesis" // Bài báo cáo cuối
}

export enum ScoreForm_Type {
  SUPERVISOR_SCORE = "supervisor_score", //Điểm giảng viên hướng dẫn
  REVIEWER_SCORE = "reviewer_score", // Điểm giảng viên phản biện
  COMMITTEE_SCORE = "committee_score", // Điểm hội đồng
  ATTENDANCE_CHECK = "attendance_check", // Điểm chuyên cần / tiến độ
  BONUS_SCORE = "bonus_score", // Điểm cộng
  OTHERS = "others" // Khác
}

export enum PriorityCase {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}