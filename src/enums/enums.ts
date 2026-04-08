export enum Role {
  USER = "user",
  UNIADMIN = "uniadmin",
  ROOMADMIN = "roomadmin",
  STUDENT = "student",
  LECTURER = "lecturer",
}

export enum MainRole {
  USER = "user",
  UNIADMIN = "uniadmin",
}

export enum RoomRole {
  ROOMADMIN = "roomadmin",
  STUDENT = "student",
  LECTURER = "lecturer",
}

export enum SubmissionStatus {
  PENDING = "pending",
  RECEIVE = "receive",
  ACCEPT = "accept",
  REJECT = "reject"
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
  M_HAVE = "must_have",
  S_HAVE = "should_have",
  C_HAVE = "could_have",
  W_HAVE = "won't_have"
}