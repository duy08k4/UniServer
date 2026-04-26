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
  NULL = "null",
  OUTLINE_FILE = "outline_file",           // Đề cương
  REPORT_FILE = "report_file",             // Báo cáo tiến độ
  FINAL_THESIS = "final_thesis",           // Bài báo cáo cuối
  SUPERVISOR_REVIEW_FILE = "supervisor_review_file", // Phiếu nhận xét của GVHD
  REVISION_FILE = "revision_file",         // Giải trình chỉnh sửa sau bảo vệ
}

export enum ThesisType {
  THESIS = "thesis",     // Khóa luận tốt nghiệp (KLTN)
  CAPSTONE = "capstone", // Tiểu luận tốt nghiệp (TLTN)
}

export enum TopicStatus {
  DRAFT = "draft",                             // Vừa tạo, chưa mời GVHD
  INVITED = "invited",                         // Đã mời GVHD, chờ phản hồi
  SUPERVISOR_REJECTED = "supervisor_rejected", // GVHD từ chối
  SUPERVISOR_ACCEPTED = "supervisor_accepted", // GVHD đồng ý, chờ SV nộp đề cương
  OUTLINE_PENDING = "outline_pending",         // SV đã nộp đề cương, chờ RoomAdmin duyệt
  OUTLINE_REJECTED = "outline_rejected",       // UniAdmin yêu cầu chỉnh sửa
  APPROVED = "approved",                       // Hoàn tất, được tham gia milestone tiếp theo
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

export enum CommitteeRole {
  CHAIRMAN = "chairman",
  REVIEWER = "reviewer",
  MEMBER = "member",
  SECRETARY = "secretary",
}

export enum ColumnAllowedRole {
  ROOMADMIN = "roomadmin",
  LECTURER = "lecturer",
  CHAIRMAN = "chairman",
  REVIEWER = "reviewer",
  MEMBER = "member",
}

export enum ColumnType {
  NORMAL = "normal",
  COMPONENT = "component",
  SUMMARY = "summary",
}

export enum ColumnLabel {
  LAST_NAME = "last_name",   // Họ lót
  FIRST_NAME = "first_name", // Tên
}