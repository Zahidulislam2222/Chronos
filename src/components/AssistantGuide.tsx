import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { assistantContent as copy, assistantEndpoint, assistantLimits, assistantReplySchema } from "@/config/assistant";

type Turn = {id: string; question: string; answer?: string; source?: {label: string; href: string} | null};

export default function AssistantGuide() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const controller = useRef<AbortController | null>(null);
  const previousTopic = useRef<string | null>(null);
  const requestSequence = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef<HTMLDivElement>(null);

  const stop = () => {
    requestSequence.current += 1;
    controller.current?.abort();
    controller.current = null;
    setPending(false);
    setStatus(copy.stopped);
  };
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => { latest.current?.scrollIntoView({block: "nearest"}); }, [turns, status]);
  useEffect(() => { if (open && !pending && document.activeElement === document.body) input.current?.focus(); }, [pending, open]);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > assistantLimits.questionCharacters || pending) return;
    const sequence = ++requestSequence.current;
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), assistantLimits.timeoutMs);
    const id = crypto.randomUUID();
    setTurns(old => [...(assistantLimits.maxTurns > 1 ? old.slice(1 - assistantLimits.maxTurns) : []), {id, question: trimmed}]);
    setQuestion(""); setPending(true); setStatus(copy.loading);
    try {
      const response = await fetch(assistantEndpoint, {method: "POST", signal: abort.signal,
        credentials: "omit", cache: "no-store", redirect: "error",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({question: trimmed, previousTopic: previousTopic.current})});
      if (!response.ok) throw new Error("Guide unavailable");
      const reply = assistantReplySchema.parse(await response.json());
      if (sequence !== requestSequence.current) return;
      previousTopic.current = reply.topic;
      const approved = copy.topics.find(topic => topic.id === reply.topic);
      const source = approved ? {label: approved.source.label, href: approved.source.href} : null;
      setTurns(old => old.map(turn => turn.id === id ? {...turn, answer: approved?.answer ?? copy.unknown, source} : turn));
      setStatus("");
    } catch {
      if (sequence === requestSequence.current) setStatus(copy.unavailable);
    } finally {
      window.clearTimeout(timeout);
      if (sequence === requestSequence.current) { setPending(false); controller.current = null; }
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(question); }
  function reset() { stop(); setTurns([]); setQuestion(""); setStatus(""); previousTopic.current = null; input.current?.focus(); }

  return <Dialog open={open} onOpenChange={value => { if (!value) stop(); setOpen(value); }}>
    <DialogTrigger asChild>
      <button className="assistant-launcher" type="button"><MessageCircle aria-hidden="true" size={18} />{copy.title}</button>
    </DialogTrigger>
    <DialogContent className="assistant-dialog" onOpenAutoFocus={event => { event.preventDefault(); input.current?.focus(); }}>
      <DialogTitle>{copy.title}</DialogTitle>
      <DialogDescription>{copy.disclosure}</DialogDescription>
      <div className="assistant-scroll">
        <p className="assistant-privacy">{copy.privacy}</p>
        <div className="assistant-suggestions" role="group" aria-label={copy.inputLabel}>
          {copy.suggestions.map(value => <button key={value} type="button" disabled={pending} onClick={() => void ask(value)}>{value}</button>)}
        </div>
        <div role="log" aria-label={copy.title} aria-live="polite" aria-relevant="additions text">
          {turns.map(turn => <div className="assistant-turn" key={turn.id}>
            <p><strong>{copy.questionPrefix}: </strong>{turn.question}</p>
            {turn.answer && <><p><strong>{copy.answerPrefix}: </strong>{turn.answer}</p>
              {turn.source && <Link to={turn.source.href}>{copy.sourceLabel}: {turn.source.label}</Link>}</>}
          </div>)}
        </div>
        <div ref={latest} role="status" aria-live="polite" aria-atomic="true">{status}</div>
        <nav className="assistant-topics" aria-label={copy.sourceLabel}>
          {copy.topics.map(topic => <Link key={topic.id} to={topic.source.href}>{topic.label}</Link>)}
        </nav>
        <p className="assistant-privacy">{copy.feedback} <Link to={copy.contact.href}>{copy.contact.label}</Link></p>
      </div>
      <form onSubmit={submit} className="assistant-form">
        <label htmlFor="assistant-question">{copy.inputLabel}</label>
        <input ref={input} id="assistant-question" value={question} onChange={event => setQuestion(event.target.value)}
          placeholder={copy.inputPlaceholder} maxLength={assistantLimits.questionCharacters} autoComplete="off" disabled={pending} required />
        <div className="assistant-actions">
          {pending ? <button type="button" onClick={stop}>{copy.stop}</button> : <button type="submit" disabled={!question.trim()}>{copy.send}</button>}
          <button type="button" onClick={reset}>{copy.reset}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
