'use client';

interface Props {
  title: string;
  body: string;
  buttonLabel: string;
  onAction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, body, buttonLabel, onAction, icon }: Props) {
  return (
    <div className="empty-page">
      <div className="empty-card">
        {icon !== undefined && <div className="empty-icon">{icon}</div>}
        <h2>{title}</h2>
        <p>{body}</p>
        <button className="btn btn-primary btn-lg" onClick={onAction}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
