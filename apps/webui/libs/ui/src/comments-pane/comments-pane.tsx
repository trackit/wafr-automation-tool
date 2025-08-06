import { components } from '@shared/api-schema';
import { Pen, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CommentsPaneProps {
  finding: components['schemas']['Finding'];
  maxHeight: number;
  minHeight: number;
  isDeleteCommentPending: boolean;
  onCancel: () => void;
  onAdded: (text: string) => void;
  onUpdate: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function usernameFromEmail(email?: string) {
  if (!email) return 'Unknown';
  return email.replace(/@.*$/, '');
}

export function CommentsPane({
  finding,
  maxHeight,
  minHeight,
  isDeleteCommentPending,
  onCancel,
  onAdded,
  onUpdate,
  onDelete,
}: CommentsPaneProps) {
  const [text, setText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [height, setHeight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [finding.comments]);

  useEffect(() => {
    if (paneRef.current) {
      const { height } = paneRef.current.getBoundingClientRect();
      setHeight(height);
    }
  }, []);

  const handleSubmit = (text: string) => {
    onAdded(text);
  };

  const handleEdit = (commentId: string) => {
    setEditingComment(commentId);
    setEditText(finding.comments?.[commentId]?.text ?? '');
  };

  const handleSaveEdit = (commentId: string) => {
    onUpdate(commentId, editText);
    setEditingComment(null);
    setText('');
  };

  const handleDelete = (commentId: string) => {
    if (isDeleteCommentPending) return;
    onDelete(commentId);
  };

  const style: { maxHeight?: string; height?: string } = {};
  if (maxHeight > minHeight) {
    style.maxHeight = `${maxHeight}px`;
  } else {
    style.height = height > minHeight ? `${minHeight}px` : `auto`;
  }
  return (
    <div className={`flex flex-col p-4`} style={style} ref={paneRef}>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 mb-4 pr-1"
        ref={listRef}
      >
        {Object.values(finding.comments ?? {}).map((c) => {
          const username = usernameFromEmail(c.author);
          return (
            <div key={c.id} className="flex space-x-2">
              <div className="w-8 h-8 min-w-8 min-h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {username.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg p-2 flex flex-col">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="break-words">{username}</span>
                  <div className="flex items-center space-x-2">
                    {editingComment === c.id ? (
                      <button
                        onClick={() => handleSaveEdit(c.id)}
                        className="text-primary text-xs cursor-pointer text-center"
                      >
                        Save
                      </button>
                    ) : (
                      <Pen
                        className="w-4 h-4 text-gray-500 cursor-pointer"
                        onClick={() => handleEdit(c.id)}
                      />
                    )}
                    <Trash
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => handleDelete(c.id)}
                    />
                  </div>
                </div>
                {editingComment === c.id ? (
                  <textarea
                    rows={1}
                    className="w-full h-full bg-transparent border-none p-0 m-0 text-sm leading-snug text-base-content resize-none overflow-hidden focus:outline-none"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onInput={(e) => {
                      const ta = e.currentTarget;
                      ta.style.height = 'auto';
                      ta.style.height = ta.scrollHeight + 'px';
                    }}
                    onFocus={(e) => {
                      const ta = e.currentTarget;
                      ta.style.height = 'auto';
                      ta.style.height = ta.scrollHeight + 'px';
                    }}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words flex-1">
                    {c.text}
                  </p>
                )}
                {c.createdAt && (
                  <span className="text-[10px] text-gray-500 self-end">
                    {formatDate(c.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <input
          type="text"
          className="input input-bordered rounded-full w-full"
          placeholder="Comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 flex justify-end space-x-4">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!text.trim()}
            onClick={() => {
              handleSubmit(text.trim());
              setText('');
            }}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentsPane;
