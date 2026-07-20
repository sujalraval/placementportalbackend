-- Case-insensitive text, used for user.email and skill.name so that
-- "Aarav@gu.ac.in" and "aarav@gu.ac.in" collide on the unique index, and
-- "React"/"react" resolve to one skill row rather than two.
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'RECRUITER', 'COORDINATOR', 'FACULTY', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('UNPLACED', 'PLACED', 'OPTED_OUT', 'HIGHER_STUDIES');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VisibilityScope" AS ENUM ('UNIVERSITY_WIDE', 'DEPARTMENT_ONLY');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('DIRECT_EMPLOYER', 'RECRUITMENT_AGENCY', 'INDIVIDUAL_AGENT');

-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('REGISTERED', 'DOCUMENTS_SUBMITTED', 'VERIFIED', 'MOU_SIGNED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "PostingKind" AS ENUM ('PLACEMENT', 'OJT');

-- CreateEnum
CREATE TYPE "PostingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PostingSource" AS ENUM ('RECRUITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('APTITUDE', 'TECHNICAL', 'HR', 'GROUP_DISCUSSION', 'MANAGERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "RoundResult" AS ENUM ('PENDING', 'PASS', 'HOLD', 'FAIL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'JOINED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('ON_CAMPUS', 'ONLINE', 'TELEPHONIC', 'OFF_CAMPUS');

-- CreateEnum
CREATE TYPE "InterviewOutcome" AS ENUM ('SCHEDULED', 'PASSED', 'FAILED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('RELEASED', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InternshipAffiliation" AS ENUM ('WITH_COLLEGE', 'INDEPENDENT');

-- CreateEnum
CREATE TYPE "InternshipStage" AS ENUM ('APPLIED', 'SELECTED', 'APPROVAL_REQUESTED', 'APPROVED', 'ONGOING', 'REPORT_SUBMITTED', 'EVALUATED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DriveStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'MARKSHEET', 'CERTIFICATE', 'ID_PROOF', 'OFFER_LETTER', 'COMPANY_REGISTRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationItemType" AS ENUM ('DOCUMENT', 'PROFILE_FIELD', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmploymentOutcomeStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'LEFT', 'HIGHER_STUDIES');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "designation" TEXT,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "department_id" UUID,
    "company_id" UUID,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "about" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "coordinator_user_id" UUID,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "degree_level" TEXT NOT NULL,
    "duration_years" INTEGER NOT NULL,
    "total_semesters" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "enrollment_no" TEXT NOT NULL,
    "department_id" UUID NOT NULL,
    "program_id" UUID,
    "batch_start_year" INTEGER NOT NULL,
    "batch_end_year" INTEGER NOT NULL,
    "cgpa" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "active_backlogs" INTEGER NOT NULL DEFAULT 0,
    "headline" TEXT,
    "bio" TEXT,
    "date_of_birth" DATE,
    "gender" TEXT,
    "category" TEXT,
    "address_line" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "placement_status" "PlacementStatus" NOT NULL DEFAULT 'UNPLACED',
    "profile_completeness" INTEGER NOT NULL DEFAULT 0,
    "cv_score" INTEGER NOT NULL DEFAULT 0,
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_link" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "id" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skill" (
    "student_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_skill_pkey" PRIMARY KEY ("student_id","skill_id")
);

-- CreateTable
CREATE TABLE "student_project" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tech_stack" TEXT[],
    "repo_url" TEXT,
    "live_url" TEXT,
    "started_on" DATE,
    "ended_on" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_experience" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "organisation" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employment_type" TEXT,
    "location" TEXT,
    "started_on" DATE NOT NULL,
    "ended_on" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_certification" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issued_on" DATE,
    "expires_on" DATE,
    "credential_id" TEXT,
    "credential_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_achievement" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "achieved_on" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_position" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "started_on" DATE,
    "ended_on" DATE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_record" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "semester" INTEGER NOT NULL,
    "sgpa" DECIMAL(4,2) NOT NULL,
    "credits" INTEGER,
    "backlogs" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "semester_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_preference" (
    "student_id" UUID NOT NULL,
    "preferred_roles" TEXT[],
    "preferred_locations" TEXT[],
    "preferred_kinds" TEXT[],
    "min_expected_ctc" DECIMAL(12,2),
    "open_to_relocate" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_preference_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "sector" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL DEFAULT 'DIRECT_EMPLOYER',
    "sector_id" UUID,
    "about" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "employee_count" TEXT,
    "hq_city" TEXT,
    "hq_country" TEXT,
    "visibility_scope" "VisibilityScope" NOT NULL DEFAULT 'UNIVERSITY_WIDE',
    "department_id" UUID,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "onboarding_stage" "OnboardingStage" NOT NULL DEFAULT 'REGISTERED',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_placement_partner" BOOLEAN NOT NULL DEFAULT false,
    "is_internship_partner" BOOLEAN NOT NULL DEFAULT false,
    "onboarded_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contact" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_hr_head" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mou" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "reference_no" TEXT NOT NULL,
    "hiring_commitment" INTEGER,
    "terms" TEXT,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "signatory_name" TEXT NOT NULL,
    "signatory_designation" TEXT,
    "signed_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mou_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_promotion_request" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_promotion_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_follow" (
    "student_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "followed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_follow_pkey" PRIMARY KEY ("student_id","company_id")
);

-- CreateTable
CREATE TABLE "job_posting" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "PostingKind" NOT NULL DEFAULT 'PLACEMENT',
    "status" "PostingStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "PostingSource" NOT NULL DEFAULT 'RECRUITER',
    "location" TEXT,
    "employment_type" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "ctc_min" DECIMAL(12,2),
    "ctc_max" DECIMAL(12,2),
    "ctc_currency" TEXT NOT NULL DEFAULT 'INR',
    "min_cgpa" DECIMAL(4,2),
    "max_active_backlogs" INTEGER,
    "eligible_batch_years" INTEGER[],
    "visibility_scope" "VisibilityScope" NOT NULL DEFAULT 'UNIVERSITY_WIDE',
    "department_id" UUID,
    "application_deadline" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting_skill" (
    "job_posting_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "job_posting_skill_pkey" PRIMARY KEY ("job_posting_id","skill_id")
);

-- CreateTable
CREATE TABLE "job_posting_department" (
    "job_posting_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,

    CONSTRAINT "job_posting_department_pkey" PRIMARY KEY ("job_posting_id","department_id")
);

-- CreateTable
CREATE TABLE "selection_round" (
    "id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoundType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "max_marks" INTEGER,
    "cutoff_marks" INTEGER,

    CONSTRAINT "selection_round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "match_score" INTEGER,
    "match_breakdown" JSONB,
    "cover_note" TEXT,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shortlisted_at" TIMESTAMPTZ(6),
    "withdrawn_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_round" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "selection_round_id" UUID NOT NULL,
    "marks" DECIMAL(6,2),
    "result" "RoundResult" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "evaluated_by_user_id" UUID,
    "evaluated_at" TIMESTAMPTZ(6),

    CONSTRAINT "application_round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "selection_round_id" UUID,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "mode" "InterviewMode" NOT NULL DEFAULT 'ON_CAMPUS',
    "venue" TEXT,
    "meeting_url" TEXT,
    "panel_members" TEXT[],
    "outcome" "InterviewOutcome" NOT NULL DEFAULT 'SCHEDULED',
    "feedback" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "reference_no" TEXT NOT NULL,
    "ctc" DECIMAL(12,2) NOT NULL,
    "ctc_currency" TEXT NOT NULL DEFAULT 'INR',
    "designation" TEXT,
    "location" TEXT,
    "joining_date" DATE,
    "status" "OfferStatus" NOT NULL DEFAULT 'RELEASED',
    "respond_by_date" DATE,
    "released_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revoke_reason" TEXT,
    "joined_at" TIMESTAMPTZ(6),

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_posting" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "stipend_amount" DECIMAL(10,2),
    "affiliation" "InternshipAffiliation" NOT NULL DEFAULT 'INDEPENDENT',
    "min_duration_weeks" INTEGER NOT NULL,
    "location" TEXT,
    "mode" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "status" "PostingStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility_scope" "VisibilityScope" NOT NULL DEFAULT 'UNIVERSITY_WIDE',
    "department_id" UUID,
    "start_date" DATE,
    "application_deadline" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "internship_posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "internship_posting_id" UUID NOT NULL,
    "stage" "InternshipStage" NOT NULL DEFAULT 'APPLIED',
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selected_at" TIMESTAMPTZ(6),
    "start_date" DATE,
    "end_date" DATE,
    "compliance_started_at" TIMESTAMPTZ(6),
    "experience_letter_issued_at" TIMESTAMPTZ(6),
    "noc_issued_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_approval" (
    "id" UUID NOT NULL,
    "internship_id" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "request_note" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "course_code" TEXT,
    "credit_count" INTEGER,
    "evaluation_basis" TEXT,
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "approval_letter_no" TEXT,
    "letter_issued_at" TIMESTAMPTZ(6),

    CONSTRAINT "internship_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentee_record" (
    "id" UUID NOT NULL,
    "internship_id" UUID NOT NULL,
    "faculty_user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" TEXT,
    "marks" DECIMAL(6,2),
    "remarks" TEXT,
    "evaluated_at" TIMESTAMPTZ(6),

    CONSTRAINT "mentee_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_report" (
    "id" UUID NOT NULL,
    "internship_id" UUID NOT NULL,
    "objectives" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "learnings" TEXT NOT NULL,
    "attachment_url" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "internship_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "drive_date" TIMESTAMPTZ(6) NOT NULL,
    "venue" TEXT,
    "mode" TEXT,
    "status" "DriveStatus" NOT NULL DEFAULT 'SCHEDULED',
    "visibility_scope" "VisibilityScope" NOT NULL DEFAULT 'UNIVERSITY_WIDE',
    "department_id" UUID,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_department" (
    "drive_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,

    CONSTRAINT "drive_department_pkey" PRIMARY KEY ("drive_id","department_id")
);

-- CreateTable
CREATE TABLE "drive_registration" (
    "drive_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pass_code" TEXT NOT NULL,
    "attended" BOOLEAN,

    CONSTRAINT "drive_registration_pkey" PRIMARY KEY ("drive_id","student_id")
);

-- CreateTable
CREATE TABLE "verification_item" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "item_type" "VerificationItemType" NOT NULL,
    "document_id" UUID,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "remarks" TEXT,

    CONSTRAINT "verification_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_event" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("user_id","channel")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" UUID NOT NULL,
    "reference_no" TEXT NOT NULL,
    "raised_by_user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "sla_due_at" TIMESTAMPTZ(6),
    "assigned_to_user_id" UUID,
    "resolution" TEXT,
    "resolved_at" TIMESTAMPTZ(6),
    "escalated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comment" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "audience" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "opens_at" TIMESTAMPTZ(6),
    "closes_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_question" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "survey_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_response" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answer" (
    "id" UUID NOT NULL,
    "response_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "survey_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closed_loop_action" (
    "id" UUID NOT NULL,
    "survey_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closed_loop_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_outcome" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "offer_id" UUID,
    "company_id" UUID,
    "status" "EmploymentOutcomeStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_employer" TEXT,
    "current_role" TEXT,
    "last_check_in_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employment_outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_item" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "image_url" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "author_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "news_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_item" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'PUBLIC',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "venue" TEXT,
    "image_url" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registration" (
    "event_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registration_pkey" PRIMARY KEY ("event_id","student_id")
);

-- CreateTable
CREATE TABLE "broadcast" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "sent_by_user_id" UUID,
    "sent_at" TIMESTAMPTZ(6),
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_item" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "album" TEXT,
    "event_id" UUID,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photo_url" TEXT,
    "is_placement_officer" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "description" TEXT,
    "category" TEXT,
    "level" TEXT,
    "duration_hours" INTEGER,
    "url" TEXT,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollment" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "course_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interview" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "interviewer_user_id" UUID,
    "meeting_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_profile" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "batch_year" INTEGER NOT NULL,
    "department_name" TEXT,
    "current_company" TEXT,
    "current_role" TEXT,
    "location" TEXT,
    "linkedin_url" TEXT,
    "photo_url" TEXT,
    "is_mentor" BOOLEAN NOT NULL DEFAULT false,
    "is_open_to_referrals" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "alumni_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_request" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "alumni_id" UUID NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_request" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "alumni_id" UUID NOT NULL,
    "job_posting_id" UUID,
    "company_name" TEXT,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_story" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "student_id" UUID,
    "alumni_id" UUID,
    "image_url" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "success_story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_thread" (
    "id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "company_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "last_message_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_snapshot" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "breakdown" JSONB,
    "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_score_snapshot" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "total" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "suggestions" JSONB,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_score_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,

    CONSTRAINT "badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_badge" (
    "student_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_badge_pkey" PRIMARY KEY ("student_id","badge_id")
);

-- CreateTable
CREATE TABLE "app_setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by_user_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_status_idx" ON "user"("role", "status");

-- CreateIndex
CREATE INDEX "user_department_id_idx" ON "user"("department_id");

-- CreateIndex
CREATE INDEX "user_company_id_idx" ON "user"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_name_key" ON "department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "department_code_key" ON "department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "department_coordinator_user_id_key" ON "department"("coordinator_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_department_id_code_key" ON "program"("department_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "student_user_id_key" ON "student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollment_no_key" ON "student"("enrollment_no");

-- CreateIndex
CREATE INDEX "student_department_id_placement_status_idx" ON "student"("department_id", "placement_status");

-- CreateIndex
CREATE INDEX "student_batch_end_year_idx" ON "student"("batch_end_year");

-- CreateIndex
CREATE INDEX "student_link_student_id_idx" ON "student_link"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_name_key" ON "skill"("name");

-- CreateIndex
CREATE INDEX "student_skill_skill_id_idx" ON "student_skill"("skill_id");

-- CreateIndex
CREATE INDEX "student_project_student_id_idx" ON "student_project"("student_id");

-- CreateIndex
CREATE INDEX "student_experience_student_id_idx" ON "student_experience"("student_id");

-- CreateIndex
CREATE INDEX "student_certification_student_id_idx" ON "student_certification"("student_id");

-- CreateIndex
CREATE INDEX "student_achievement_student_id_idx" ON "student_achievement"("student_id");

-- CreateIndex
CREATE INDEX "student_position_student_id_idx" ON "student_position"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "semester_record_student_id_semester_key" ON "semester_record"("student_id", "semester");

-- CreateIndex
CREATE INDEX "document_student_id_status_idx" ON "document"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sector_name_key" ON "sector"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sector_code_key" ON "sector"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_slug_key" ON "company"("slug");

-- CreateIndex
CREATE INDEX "company_visibility_scope_department_id_idx" ON "company"("visibility_scope", "department_id");

-- CreateIndex
CREATE INDEX "company_sector_id_idx" ON "company"("sector_id");

-- CreateIndex
CREATE INDEX "company_contact_company_id_idx" ON "company_contact"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "mou_company_id_key" ON "mou"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "mou_reference_no_key" ON "mou"("reference_no");

-- CreateIndex
CREATE INDEX "company_promotion_request_company_id_status_idx" ON "company_promotion_request"("company_id", "status");

-- CreateIndex
CREATE INDEX "company_follow_company_id_idx" ON "company_follow"("company_id");

-- CreateIndex
CREATE INDEX "job_posting_status_published_at_idx" ON "job_posting"("status", "published_at");

-- CreateIndex
CREATE INDEX "job_posting_company_id_status_idx" ON "job_posting"("company_id", "status");

-- CreateIndex
CREATE INDEX "job_posting_visibility_scope_department_id_idx" ON "job_posting"("visibility_scope", "department_id");

-- CreateIndex
CREATE INDEX "job_posting_skill_skill_id_idx" ON "job_posting_skill"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "selection_round_job_posting_id_sequence_key" ON "selection_round"("job_posting_id", "sequence");

-- CreateIndex
CREATE INDEX "application_job_posting_id_status_idx" ON "application"("job_posting_id", "status");

-- CreateIndex
CREATE INDEX "application_student_id_status_idx" ON "application"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "application_student_id_job_posting_id_key" ON "application"("student_id", "job_posting_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_round_application_id_selection_round_id_key" ON "application_round"("application_id", "selection_round_id");

-- CreateIndex
CREATE INDEX "interview_application_id_idx" ON "interview"("application_id");

-- CreateIndex
CREATE INDEX "interview_scheduled_at_idx" ON "interview"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "offer_application_id_key" ON "offer"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_reference_no_key" ON "offer"("reference_no");

-- CreateIndex
CREATE INDEX "offer_status_idx" ON "offer"("status");

-- CreateIndex
CREATE INDEX "internship_posting_status_published_at_idx" ON "internship_posting"("status", "published_at");

-- CreateIndex
CREATE INDEX "internship_posting_company_id_idx" ON "internship_posting"("company_id");

-- CreateIndex
CREATE INDEX "internship_internship_posting_id_stage_idx" ON "internship"("internship_posting_id", "stage");

-- CreateIndex
CREATE INDEX "internship_student_id_stage_idx" ON "internship"("student_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "internship_student_id_internship_posting_id_key" ON "internship"("student_id", "internship_posting_id");

-- CreateIndex
CREATE UNIQUE INDEX "internship_approval_internship_id_key" ON "internship_approval"("internship_id");

-- CreateIndex
CREATE UNIQUE INDEX "internship_approval_approval_letter_no_key" ON "internship_approval"("approval_letter_no");

-- CreateIndex
CREATE INDEX "internship_approval_status_idx" ON "internship_approval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentee_record_internship_id_key" ON "mentee_record"("internship_id");

-- CreateIndex
CREATE INDEX "mentee_record_faculty_user_id_idx" ON "mentee_record"("faculty_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "internship_report_internship_id_key" ON "internship_report"("internship_id");

-- CreateIndex
CREATE INDEX "drive_status_drive_date_idx" ON "drive"("status", "drive_date");

-- CreateIndex
CREATE INDEX "drive_company_id_idx" ON "drive"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_registration_pass_code_key" ON "drive_registration"("pass_code");

-- CreateIndex
CREATE INDEX "drive_registration_student_id_idx" ON "drive_registration"("student_id");

-- CreateIndex
CREATE INDEX "verification_item_student_id_status_idx" ON "verification_item"("student_id", "status");

-- CreateIndex
CREATE INDEX "verification_item_status_submitted_at_idx" ON "verification_item"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "outbox_event_status_occurred_at_idx" ON "outbox_event"("status", "occurred_at");

-- CreateIndex
CREATE INDEX "notification_user_id_is_read_created_at_idx" ON "notification"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_reference_no_key" ON "ticket"("reference_no");

-- CreateIndex
CREATE INDEX "ticket_status_sla_due_at_idx" ON "ticket"("status", "sla_due_at");

-- CreateIndex
CREATE INDEX "ticket_raised_by_user_id_idx" ON "ticket"("raised_by_user_id");

-- CreateIndex
CREATE INDEX "ticket_comment_ticket_id_idx" ON "ticket_comment"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_question_survey_id_sequence_key" ON "survey_question"("survey_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "survey_response_survey_id_user_id_key" ON "survey_response"("survey_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answer_response_id_question_id_key" ON "survey_answer"("response_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "employment_outcome_student_id_key" ON "employment_outcome"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "employment_outcome_offer_id_key" ON "employment_outcome"("offer_id");

-- CreateIndex
CREATE INDEX "employment_outcome_status_idx" ON "employment_outcome"("status");

-- CreateIndex
CREATE UNIQUE INDEX "news_item_slug_key" ON "news_item"("slug");

-- CreateIndex
CREATE INDEX "news_item_status_published_at_idx" ON "news_item"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_item_slug_key" ON "event_item"("slug");

-- CreateIndex
CREATE INDEX "event_item_status_starts_at_idx" ON "event_item"("status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollment_student_id_course_id_key" ON "course_enrollment"("student_id", "course_id");

-- CreateIndex
CREATE INDEX "mock_interview_student_id_idx" ON "mock_interview"("student_id");

-- CreateIndex
CREATE INDEX "alumni_profile_is_mentor_idx" ON "alumni_profile"("is_mentor");

-- CreateIndex
CREATE UNIQUE INDEX "mentorship_request_student_id_alumni_id_key" ON "mentorship_request"("student_id", "alumni_id");

-- CreateIndex
CREATE INDEX "referral_request_student_id_idx" ON "referral_request"("student_id");

-- CreateIndex
CREATE INDEX "message_thread_company_id_idx" ON "message_thread"("company_id");

-- CreateIndex
CREATE INDEX "message_thread_id_sent_at_idx" ON "message"("thread_id", "sent_at");

-- CreateIndex
CREATE INDEX "readiness_snapshot_student_id_captured_at_idx" ON "readiness_snapshot"("student_id", "captured_at");

-- CreateIndex
CREATE INDEX "cv_score_snapshot_student_id_computed_at_idx" ON "cv_score_snapshot"("student_id", "computed_at");

-- CreateIndex
CREATE UNIQUE INDEX "badge_code_key" ON "badge"("code");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_created_at_idx" ON "audit_log"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_coordinator_user_id_fkey" FOREIGN KEY ("coordinator_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program" ADD CONSTRAINT "program_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_link" ADD CONSTRAINT "student_link_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skill" ADD CONSTRAINT "student_skill_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skill" ADD CONSTRAINT "student_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_project" ADD CONSTRAINT "student_project_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_experience" ADD CONSTRAINT "student_experience_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_certification" ADD CONSTRAINT "student_certification_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievement" ADD CONSTRAINT "student_achievement_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_position" ADD CONSTRAINT "student_position_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_record" ADD CONSTRAINT "semester_record_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_preference" ADD CONSTRAINT "student_preference_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_onboarded_by_user_id_fkey" FOREIGN KEY ("onboarded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contact" ADD CONSTRAINT "company_contact_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mou" ADD CONSTRAINT "mou_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_promotion_request" ADD CONSTRAINT "company_promotion_request_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_promotion_request" ADD CONSTRAINT "company_promotion_request_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_promotion_request" ADD CONSTRAINT "company_promotion_request_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_follow" ADD CONSTRAINT "company_follow_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_follow" ADD CONSTRAINT "company_follow_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_skill" ADD CONSTRAINT "job_posting_skill_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_skill" ADD CONSTRAINT "job_posting_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_department" ADD CONSTRAINT "job_posting_department_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_department" ADD CONSTRAINT "job_posting_department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_round" ADD CONSTRAINT "selection_round_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_round" ADD CONSTRAINT "application_round_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_round" ADD CONSTRAINT "application_round_selection_round_id_fkey" FOREIGN KEY ("selection_round_id") REFERENCES "selection_round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_round" ADD CONSTRAINT "application_round_evaluated_by_user_id_fkey" FOREIGN KEY ("evaluated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_selection_round_id_fkey" FOREIGN KEY ("selection_round_id") REFERENCES "selection_round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_posting" ADD CONSTRAINT "internship_posting_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_posting" ADD CONSTRAINT "internship_posting_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_posting" ADD CONSTRAINT "internship_posting_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship" ADD CONSTRAINT "internship_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship" ADD CONSTRAINT "internship_internship_posting_id_fkey" FOREIGN KEY ("internship_posting_id") REFERENCES "internship_posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_approval" ADD CONSTRAINT "internship_approval_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_approval" ADD CONSTRAINT "internship_approval_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentee_record" ADD CONSTRAINT "mentee_record_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentee_record" ADD CONSTRAINT "mentee_record_faculty_user_id_fkey" FOREIGN KEY ("faculty_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_report" ADD CONSTRAINT "internship_report_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive" ADD CONSTRAINT "drive_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive" ADD CONSTRAINT "drive_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive" ADD CONSTRAINT "drive_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_department" ADD CONSTRAINT "drive_department_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_department" ADD CONSTRAINT "drive_department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_registration" ADD CONSTRAINT "drive_registration_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_registration" ADD CONSTRAINT "drive_registration_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_item" ADD CONSTRAINT "verification_item_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_item" ADD CONSTRAINT "verification_item_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_item" ADD CONSTRAINT "verification_item_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "outbox_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_raised_by_user_id_fkey" FOREIGN KEY ("raised_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comment" ADD CONSTRAINT "ticket_comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comment" ADD CONSTRAINT "ticket_comment_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey" ADD CONSTRAINT "survey_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_question" ADD CONSTRAINT "survey_question_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answer" ADD CONSTRAINT "survey_answer_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answer" ADD CONSTRAINT "survey_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closed_loop_action" ADD CONSTRAINT "closed_loop_action_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closed_loop_action" ADD CONSTRAINT "closed_loop_action_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_outcome" ADD CONSTRAINT "employment_outcome_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_outcome" ADD CONSTRAINT "employment_outcome_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_outcome" ADD CONSTRAINT "employment_outcome_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_outcome" ADD CONSTRAINT "employment_outcome_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_item" ADD CONSTRAINT "news_item_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_item" ADD CONSTRAINT "gallery_item_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollment" ADD CONSTRAINT "course_enrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollment" ADD CONSTRAINT "course_enrollment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interview" ADD CONSTRAINT "mock_interview_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interview" ADD CONSTRAINT "mock_interview_interviewer_user_id_fkey" FOREIGN KEY ("interviewer_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_request" ADD CONSTRAINT "mentorship_request_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_request" ADD CONSTRAINT "mentorship_request_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_request" ADD CONSTRAINT "referral_request_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_request" ADD CONSTRAINT "referral_request_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_request" ADD CONSTRAINT "referral_request_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_posting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_story" ADD CONSTRAINT "success_story_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_story" ADD CONSTRAINT "success_story_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_thread" ADD CONSTRAINT "message_thread_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_thread" ADD CONSTRAINT "message_thread_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "message_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_snapshot" ADD CONSTRAINT "readiness_snapshot_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_score_snapshot" ADD CONSTRAINT "cv_score_snapshot_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badge" ADD CONSTRAINT "student_badge_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badge" ADD CONSTRAINT "student_badge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_setting" ADD CONSTRAINT "app_setting_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Invariants from the Admin "data integrity" self-check that foreign keys
-- alone don't cover. The doc lists 9 checks; the FKs above satisfy six of
-- them outright. These cover two more. See the note at the bottom for the
-- ninth.
-- ---------------------------------------------------------------------------

-- "Company visibility scopes resolve": a DEPARTMENT_ONLY row must name its
-- department, a UNIVERSITY_WIDE row must not. Same rule for anything a
-- company can scope.
ALTER TABLE "company" ADD CONSTRAINT "company_scope_department_consistent"
  CHECK (("visibility_scope" = 'DEPARTMENT_ONLY') = ("department_id" IS NOT NULL));

ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_scope_department_consistent"
  CHECK (("visibility_scope" = 'DEPARTMENT_ONLY') = ("department_id" IS NOT NULL));

ALTER TABLE "internship_posting" ADD CONSTRAINT "internship_posting_scope_department_consistent"
  CHECK (("visibility_scope" = 'DEPARTMENT_ONLY') = ("department_id" IS NOT NULL));

ALTER TABLE "drive" ADD CONSTRAINT "drive_scope_department_consistent"
  CHECK (("visibility_scope" = 'DEPARTMENT_ONLY') = ("department_id" IS NOT NULL));

-- "Recruiter accounts link to real companies": the FK guarantees the company
-- exists, this guarantees the link is present for recruiters and absent for
-- everyone else. Coordinators and faculty are scoped by department instead;
-- a student's department lives on `student`, not here; an admin is unscoped.
ALTER TABLE "user" ADD CONSTRAINT "user_role_scope_consistent"
  CHECK (
    CASE "role"
      WHEN 'RECRUITER'   THEN "company_id" IS NOT NULL AND "department_id" IS NULL
      WHEN 'COORDINATOR' THEN "department_id" IS NOT NULL AND "company_id" IS NULL
      WHEN 'FACULTY'     THEN "department_id" IS NOT NULL AND "company_id" IS NULL
      ELSE "company_id" IS NULL AND "department_id" IS NULL
    END
  );

-- A posting's CTC band must not be inverted.
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_ctc_band_ordered"
  CHECK ("ctc_min" IS NULL OR "ctc_max" IS NULL OR "ctc_min" <= "ctc_max");

-- Two checks stay in the application layer because they span rows in a way a
-- CHECK cannot see:
--   * "Candidate stage matches offers" — an application with an offer row
--     must sit in OFFER/JOINED. Needs a trigger or a service-layer guard.
--   * mentee_record.faculty_user_id must point at a user whose role is
--     FACULTY. Needs a trigger or a composite FK on (id, role).
