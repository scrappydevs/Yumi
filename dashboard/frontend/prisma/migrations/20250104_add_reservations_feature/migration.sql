-- CreateEnum for ReservationStatus
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'canceled', 'expired');

-- CreateEnum for RsvpStatus
CREATE TYPE "RsvpStatus" AS ENUM ('pending', 'yes', 'no', 'canceled');

-- CreateTable: reservations
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizerId" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "partySize" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: reservation_invites
CREATE TABLE "reservation_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "inviteeProfileId" UUID,
    "inviteePhoneE164" TEXT NOT NULL,
    "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: calendar_events
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: outbound_messages
CREATE TABLE "outbound_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "toE164" TEXT NOT NULL,
    "messageSid" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: used_jtis
CREATE TABLE "used_jtis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jti" TEXT NOT NULL,
    "resvId" TEXT NOT NULL,
    "usedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_jtis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_reservationId_key" ON "calendar_events"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_messages_messageSid_key" ON "outbound_messages"("messageSid");

-- CreateIndex
CREATE UNIQUE INDEX "used_jtis_jti_key" ON "used_jtis"("jti");

-- CreateIndex
CREATE INDEX "reservation_invites_reservationId_idx" ON "reservation_invites"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_invites_inviteePhoneE164_idx" ON "reservation_invites"("inviteePhoneE164");

-- CreateIndex
CREATE INDEX "outbound_messages_reservationId_idx" ON "outbound_messages"("reservationId");

-- CreateIndex
CREATE INDEX "used_jtis_jti_idx" ON "used_jtis"("jti");

-- AddForeignKey for reservations -> profiles (organizer)
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organizerId_fkey"
    FOREIGN KEY ("organizerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for reservations -> restaurants
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for invitation -> reservation
ALTER TABLE "reservation_invites" ADD CONSTRAINT "reservation_invites_reservationId_fkey" 
    FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

