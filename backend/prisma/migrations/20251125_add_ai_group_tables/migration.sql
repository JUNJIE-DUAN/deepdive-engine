-- CreateEnum
CREATE TYPE "TopicType" AS ENUM ('PRIVATE', 'PUBLIC', 'CHANNEL');

-- CreateEnum
CREATE TYPE "TopicRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'MARKDOWN', 'CODE', 'FILE', 'IMAGE', 'LINK');

-- CreateEnum
CREATE TYPE "MentionType" AS ENUM ('USER', 'AI', 'ALL');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('FILE', 'IMAGE', 'LINK', 'RESOURCE');

-- CreateEnum
CREATE TYPE "TopicResourceType" AS ENUM ('LINK', 'FILE', 'NOTE', 'LIBRARY_RESOURCE');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "TopicType" NOT NULL DEFAULT 'PRIVATE',
    "avatar" TEXT,
    "settings" JSONB DEFAULT '{}',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMember" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TopicRole" NOT NULL DEFAULT 'MEMBER',
    "nickname" VARCHAR(100),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TopicMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicAIMember" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "ai_model" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar" TEXT,
    "role_description" VARCHAR(200),
    "system_prompt" TEXT,
    "context_window" INTEGER NOT NULL DEFAULT 20,
    "response_style" VARCHAR(50),
    "auto_respond" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "added_by_id" TEXT NOT NULL,

    CONSTRAINT "TopicAIMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMessage" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "ai_member_id" TEXT,
    "content" TEXT NOT NULL,
    "content_type" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "reply_to_id" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "prompt" TEXT,
    "model_used" VARCHAR(50),
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "TopicMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMessageMention" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT,
    "ai_member_id" TEXT,
    "mention_type" "MentionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicMessageMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMessageAttachment" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "mime_type" VARCHAR(100),
    "resource_id" TEXT,
    "link_preview" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicMessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMessageReaction" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicResource" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "type" "TopicResourceType" NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "url" TEXT,
    "resource_id" TEXT,
    "file_url" TEXT,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "source_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by_id" TEXT NOT NULL,

    CONSTRAINT "TopicResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSummary" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "from_message_id" TEXT,
    "to_message_id" TEXT,
    "generated_by" VARCHAR(50),
    "prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "TopicSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_created_by_id_idx" ON "Topic"("created_by_id");

-- CreateIndex
CREATE INDEX "Topic_type_idx" ON "Topic"("type");

-- CreateIndex
CREATE INDEX "Topic_is_archived_idx" ON "Topic"("is_archived");

-- CreateIndex
CREATE INDEX "TopicMember_topic_id_idx" ON "TopicMember"("topic_id");

-- CreateIndex
CREATE INDEX "TopicMember_user_id_idx" ON "TopicMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMember_topic_id_user_id_key" ON "TopicMember"("topic_id", "user_id");

-- CreateIndex
CREATE INDEX "TopicAIMember_topic_id_idx" ON "TopicAIMember"("topic_id");

-- CreateIndex
CREATE INDEX "TopicMessage_topic_id_idx" ON "TopicMessage"("topic_id");

-- CreateIndex
CREATE INDEX "TopicMessage_sender_id_idx" ON "TopicMessage"("sender_id");

-- CreateIndex
CREATE INDEX "TopicMessage_ai_member_id_idx" ON "TopicMessage"("ai_member_id");

-- CreateIndex
CREATE INDEX "TopicMessage_created_at_idx" ON "TopicMessage"("created_at");

-- CreateIndex
CREATE INDEX "TopicMessageMention_message_id_idx" ON "TopicMessageMention"("message_id");

-- CreateIndex
CREATE INDEX "TopicMessageAttachment_message_id_idx" ON "TopicMessageAttachment"("message_id");

-- CreateIndex
CREATE INDEX "TopicMessageReaction_message_id_idx" ON "TopicMessageReaction"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMessageReaction_message_id_user_id_emoji_key" ON "TopicMessageReaction"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "TopicResource_topic_id_idx" ON "TopicResource"("topic_id");

-- CreateIndex
CREATE INDEX "TopicSummary_topic_id_idx" ON "TopicSummary"("topic_id");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMember" ADD CONSTRAINT "TopicMember_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMember" ADD CONSTRAINT "TopicMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicAIMember" ADD CONSTRAINT "TopicAIMember_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicAIMember" ADD CONSTRAINT "TopicAIMember_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessage" ADD CONSTRAINT "TopicMessage_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessage" ADD CONSTRAINT "TopicMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessage" ADD CONSTRAINT "TopicMessage_ai_member_id_fkey" FOREIGN KEY ("ai_member_id") REFERENCES "TopicAIMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessage" ADD CONSTRAINT "TopicMessage_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "TopicMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessageMention" ADD CONSTRAINT "TopicMessageMention_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "TopicMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessageMention" ADD CONSTRAINT "TopicMessageMention_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessageMention" ADD CONSTRAINT "TopicMessageMention_ai_member_id_fkey" FOREIGN KEY ("ai_member_id") REFERENCES "TopicAIMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessageAttachment" ADD CONSTRAINT "TopicMessageAttachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "TopicMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessageReaction" ADD CONSTRAINT "TopicMessageReaction_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "TopicMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMessageReaction" ADD CONSTRAINT "TopicMessageReaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicResource" ADD CONSTRAINT "TopicResource_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicResource" ADD CONSTRAINT "TopicResource_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSummary" ADD CONSTRAINT "TopicSummary_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSummary" ADD CONSTRAINT "TopicSummary_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
