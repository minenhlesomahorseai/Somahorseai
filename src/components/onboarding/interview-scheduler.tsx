"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Send,
  X,
} from "lucide-react";

import { respondAdminInterview, proposeAdminInterview } from "@/app/admin/interviews/[talentId]/actions";
import {
  proposeTalentInterview,
  respondTalentInterview,
} from "@/app/onboarding/talent/actions";
import type { InterviewSchedulingData } from "@/lib/auth/types";

interface InterviewSchedulerProps {
  role: "admin" | "talent";
  talentId: string;
  talentName?: string | null;
  data: InterviewSchedulingData;
  googleCalendarUrl?: string | null;
}

function localInputValue(date: Date): string {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

function displayTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time.format(start)}–${time.format(end)}`;
}

export function InterviewScheduler({
  role,
  talentId,
  talentName,
  data,
  googleCalendarUrl,
}: InterviewSchedulerProps) {
  const pendingProposal = data.proposals.find(
    (proposal) => proposal.status === "pending"
  );
  const schedule = data.schedule;
  const confirmedProposal = schedule?.confirmed_proposal_id
    ? data.proposals.find(
        (proposal) => proposal.id === schedule.confirmed_proposal_id
      )
    : null;
  const now = useMemo(() => new Date(), []);
  const [startsAt, setStartsAt] = useState(
    localInputValue(new Date(now.getTime() + 24 * 60 * 60_000))
  );
  const [note, setNote] = useState("");
  const [meetingUrl, setMeetingUrl] = useState(
    data.schedule?.meeting_url ?? ""
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submitProposal = () => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const iso = new Date(startsAt).toISOString();
        if (role === "admin") {
          await proposeAdminInterview(talentId, {
            startsAt: iso,
            note,
            meetingUrl,
          });
        } else {
          await proposeTalentInterview({ startsAt: iso, note });
        }
        setMessage("Time proposed. The other participant has been emailed.");
        window.location.reload();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not propose this time."
        );
      }
    });
  };

  const respond = (proposalId: string, accept: boolean) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        if (role === "admin") {
          await respondAdminInterview(
            talentId,
            proposalId,
            accept,
            meetingUrl
          );
        } else {
          await respondTalentInterview(proposalId, accept);
        }
        setMessage(
          accept
            ? "Interview confirmed. Final calendar emails are queued."
            : "Time declined. Scheduling remains open for another proposal."
        );
        window.location.reload();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not save your response."
        );
      }
    });
  };

  if (confirmedProposal && schedule && schedule.status !== "cancelled") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-accent-teal/25 bg-accent-teal/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-teal text-white">
              <CalendarCheck2 className="size-5" />
            </span>
            <div>
              <p className="cue text-accent-teal">Confirmed interview</p>
              <h2 className="mt-1 font-display text-xl font-bold text-navy">
                {displayTime(
                  confirmedProposal.starts_at,
                  confirmedProposal.ends_at
                )}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Both participants agreed to this time. A calendar file and final
                confirmation email were sent to everyone.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {schedule.meeting_url ? (
              <a
                href={schedule.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-navy-mid px-5 text-sm font-semibold text-white transition hover:bg-navy"
              >
                Join meeting <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {googleCalendarUrl ? (
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border-strong bg-white px-5 text-sm font-semibold text-navy-mid transition hover:border-blue-vivid"
              >
                Add to Google Calendar <CalendarDays className="size-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        {role === "admin" ? (
          <p className="rounded-xl border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
            After the interview time has passed, return to the certification
            console to approve or reject {talentName ?? "the candidate"}.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Keep this page for the latest meeting details.
          </p>
        )}
      </div>
    );
  }

  const pendingIsMine = pendingProposal?.proposer_role === role;
  const min = localInputValue(new Date(now.getTime() + 5 * 60_000));
  const max = localInputValue(new Date(now.getTime() + 7 * 24 * 60 * 60_000));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-navy-mid" />
          <h2 className="font-display text-xl font-bold text-navy">
            Agree on an interview time
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Suggest any time within the next seven days. Either participant can
          decline and propose another time; the conversation stays open until
          the other participant accepts.
        </p>
      </div>

      {pendingProposal ? (
        <div className="rounded-2xl border border-blue-vivid/20 bg-blue-light/40 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-navy-mid shadow-soft">
              <Clock3 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-navy-mid/70">
                {pendingIsMine ? "Waiting for a response" : "Your response needed"}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-navy">
                {displayTime(
                  pendingProposal.starts_at,
                  pendingProposal.ends_at
                )}
              </p>
              {pendingProposal.note ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  “{pendingProposal.note}”
                </p>
              ) : null}
            </div>
          </div>
          {!pendingIsMine ? (
            <div className="mt-4 space-y-3">
              {role === "admin" ? (
                <Field
                  label="Google Meet or video link (optional)"
                  value={meetingUrl}
                  onChange={setMeetingUrl}
                  type="url"
                  placeholder="https://meet.google.com/..."
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => respond(pendingProposal.id, true)}
                  disabled={pending}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent-teal px-5 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                >
                  <Check className="size-4" /> Accept and confirm
                </button>
                <button
                  type="button"
                  onClick={() => respond(pendingProposal.id, false)}
                  disabled={pending}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border-strong bg-white px-5 text-sm font-semibold text-muted-foreground transition hover:text-accent-amber disabled:opacity-50"
                >
                  <X className="size-4" /> Decline
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-white/75 p-5">
        <p className="font-display text-sm font-bold text-navy">
          {pendingProposal ? "Suggest a different time" : "Propose a time"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor={`interview-time-${role}`}
              className="text-xs font-bold uppercase tracking-wide text-navy-mid/75"
            >
              Date and time
            </label>
            <input
              id={`interview-time-${role}`}
              type="datetime-local"
              min={min}
              max={max}
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-border-strong bg-white px-3 text-sm text-navy focus:border-blue-vivid focus:outline-none focus:ring-2 focus:ring-blue-vivid/10"
            />
            <p className="text-[11px] text-muted-foreground">
              Interview duration: 45 minutes
            </p>
          </div>
          <Field
            label="Optional note"
            value={note}
            onChange={setNote}
            placeholder="Anything the other person should know"
          />
          {role === "admin" ? (
            <Field
              label="Google Meet or video link (optional)"
              value={meetingUrl}
              onChange={setMeetingUrl}
              type="url"
              placeholder="https://meet.google.com/..."
            />
          ) : null}
        </div>
        <button
          type="button"
          onClick={submitProposal}
          disabled={pending || !startsAt}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-navy-mid px-6 text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:opacity-50"
        >
          <Send className="size-4" />
          {pending ? "Sending…" : "Send proposed time"}
        </button>
      </div>

      {message ? (
        <p className="rounded-xl border border-accent-teal/25 bg-accent-teal/10 px-4 py-3 text-sm font-medium text-accent-teal">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-accent-amber/25 bg-accent-amber/10 px-4 py-3 text-sm font-medium text-accent-amber">
          {error}
        </p>
      ) : null}

      {data.proposals.some(
        (proposal) =>
          proposal.status === "rejected" || proposal.status === "superseded"
      ) ? (
        <details className="rounded-xl border border-border bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-xs font-bold text-navy-mid">
            Previous proposals
          </summary>
          <div className="mt-3 space-y-2">
            {data.proposals
              .filter(
                (proposal) =>
                  proposal.status === "rejected" ||
                  proposal.status === "superseded"
              )
              .slice(0, 6)
              .map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs text-muted-foreground first:border-0 first:pt-0"
                >
                  <span>
                    {displayTime(proposal.starts_at, proposal.ends_at)}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 font-semibold capitalize">
                    {proposal.status}
                  </span>
                </div>
              ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "url";
}) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wide text-navy-mid/75"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-border-strong bg-white px-3 text-sm text-navy placeholder:text-muted-foreground/50 focus:border-blue-vivid focus:outline-none focus:ring-2 focus:ring-blue-vivid/10"
      />
    </div>
  );
}
